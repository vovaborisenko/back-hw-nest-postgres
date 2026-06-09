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

        this.addBonusPoint(playerProgresses);
        this.updatePlayerProgressGameResult(playerProgresses);

        await entityManager.save(playerProgresses);
      }

      return savedAnswer.id;
    });
  }

  private findLastAnswer(answers: Answer[]): Answer | undefined {
    return answers.reduce<Answer | undefined>((lastAnswer, answer) => {
      const lastAnswerCreatedAt = lastAnswer?.createdAt?.valueOf() || 0;

      if (answer.createdAt.valueOf() > lastAnswerCreatedAt) {
        return answer;
      }

      return lastAnswer;
    }, undefined);
  }

  private findQuickestPlayerProgress(
    playerProgresses: PlayerProgress[],
  ): PlayerProgress | undefined {
    return playerProgresses.reduce<PlayerProgress | undefined>(
      (result, playerProgress) => {
        const resultLastAnswerCreatedAt =
          this.findLastAnswer(result?.answers || [])?.createdAt.valueOf() ||
          Infinity;
        const currentLastAnswerCreatedAt =
          this.findLastAnswer(playerProgress.answers)?.createdAt.valueOf() ||
          Infinity;

        if (currentLastAnswerCreatedAt < resultLastAnswerCreatedAt) {
          return playerProgress;
        }

        return result;
      },
      undefined,
    );
  }

  private addBonusPoint(playerProgresses: PlayerProgress[]): PlayerProgress[] {
    const quickestPlayerProgress =
      this.findQuickestPlayerProgress(playerProgresses);

    if (quickestPlayerProgress && quickestPlayerProgress.score > 0) {
      quickestPlayerProgress.score += 1;
    }

    return playerProgresses;
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
