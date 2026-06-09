import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-code';
import { PlayerProgressRepository } from '../../infrastucture/player-progress.repository';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AnswerStatus } from '../../enum/answer-status';
import { Answer } from '../../domain/answer.entity';
import { GameRepository } from '../../../game/infrastucture/game.repository';
import { PlayerProgress } from '../../domain/player-progress.entity';
import { Game } from '../../../game/domain/game.entity';
import { GameStatus } from '../../../game/enum/game-status';
import { GameResult } from '../../enum/game-result';

export class AnswerQuestionCommand extends Command<number> {
  constructor(
    public readonly dto: {
      userId: number;
      answer: string;
    },
  ) {
    super();
  }
}

@CommandHandler(AnswerQuestionCommand)
export class AnswerQuestionUseCase implements ICommandHandler<AnswerQuestionCommand> {
  constructor(
    @InjectDataSource()
    protected readonly dataSource: DataSource,
    protected readonly playerProgressRepository: PlayerProgressRepository,
    protected readonly gameRepository: GameRepository,
  ) {}

  async execute({ dto }: AnswerQuestionCommand): Promise<number> {
    const playerProgress = await this.playerProgressRepository.findActive(
      dto.userId,
    );

    if (!playerProgress) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'User does not have active game',
      });
    }

    const game = await this.gameRepository.findById(playerProgress.gameId);
    const nextQuestionIndex =
      game?.playerProgresses.find(({ id }) => id === playerProgress.id)?.answers
        .length ?? NaN;
    const unansweredQuestion = game?.gameToQuestions[nextQuestionIndex];

    if (!game || !unansweredQuestion) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'User does not have unanswered questions',
      });
    }

    const questionCount = game.gameToQuestions.length;

    return this.dataSource.transaction(async (entityManager) => {
      const isLastAnswerInGame = game.playerProgresses.every(
        ({ answers, id }) => {
          if (id === playerProgress.id) {
            return answers.length === questionCount - 1;
          }

          return answers.length === questionCount;
        },
      );

      const status = unansweredQuestion.question.keys.includes(dto.answer)
        ? AnswerStatus.Correct
        : AnswerStatus.Incorrect;

      const answer = Answer.create({
        playerProgressId: playerProgress.id,
        questionId: unansweredQuestion.questionId,
        text: dto.answer,
        status,
      });

      const savedAnswer = await entityManager.save(answer);

      if (status === AnswerStatus.Correct) {
        await entityManager.update(
          PlayerProgress,
          { id: playerProgress.id },
          { score: playerProgress.score + 1 },
        );
      }

      if (isLastAnswerInGame) {
        await entityManager.update(
          Game,
          { id: game.id },
          { status: GameStatus.Finished, finishedAt: new Date() },
        );

        const playerProgresses = await entityManager.find(PlayerProgress, {
          where: {
            gameId: game.id,
          },
          relations: { answers: true },
        });

        const playerProgressWithAdditionalPoint =
          this.findPlayerProgressWithAdditionalPoint(
            playerProgresses,
            questionCount,
          );

        if (playerProgressWithAdditionalPoint) {
          playerProgressWithAdditionalPoint.score =
            playerProgressWithAdditionalPoint.score + 1;
        }

        this.updatePlayerProgressGameResult(playerProgresses);

        await entityManager.save(playerProgresses);
      }

      return savedAnswer.id;
    });
  }

  private findPlayerProgressWithAdditionalPoint(
    playerProgresses: PlayerProgress[],
    questionCount: number,
  ): PlayerProgress | null {
    return playerProgresses.reduce<PlayerProgress | null>(
      (result, playerProgress) => {
        const lastAnswerCreatedAt =
          result?.answers[questionCount - 1]?.createdAt.valueOf() || Infinity;

        if (
          playerProgress.score > 0 &&
          playerProgress.answers[questionCount - 1] &&
          playerProgress.answers[questionCount - 1].createdAt.valueOf() <
            lastAnswerCreatedAt
        ) {
          return playerProgress;
        }

        return result;
      },
      null,
    );
  }

  private updatePlayerProgressGameResult(
    playerProgresses: PlayerProgress[],
  ): PlayerProgress[] {
    const maxScore = playerProgresses.reduce(
      (result, { score }) => Math.max(result, score),
      0,
    );
    const isDraw = playerProgresses.every(({ score }) => score === maxScore);

    playerProgresses.forEach((playerProgress) => {
      if (isDraw) {
        playerProgress.gameResult = GameResult.Draw;
        return;
      }

      if (playerProgress.score === maxScore) {
        playerProgress.gameResult = GameResult.Win;
        return;
      }

      playerProgress.gameResult = GameResult.Lose;
    });

    return playerProgresses;
  }
}
