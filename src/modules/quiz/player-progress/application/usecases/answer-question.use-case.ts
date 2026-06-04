import {
  Command,
  CommandHandler,
  EventBus,
  ICommandHandler,
} from '@nestjs/cqrs';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-code';
import { PlayerProgressRepository } from '../../infrastucture/player-progress.repository';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AnswerStatus } from '../../enum/answer-status';
import { Answer } from '../../domain/answer.entity';
import { AnswerAddedEvent } from '../events/answer-added.event';

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
    protected readonly eventBus: EventBus,
    protected readonly playerProgressRepository: PlayerProgressRepository,
  ) {}

  async execute({ dto }: AnswerQuestionCommand): Promise<number> {
    const playerProgress = await this.playerProgressRepository.findActive(
      dto.userId,
    );
    const unansweredQuestion =
      playerProgress?.game.gameToQuestions[playerProgress?.answers.length];

    if (!playerProgress || !unansweredQuestion) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'User does not have active game',
      });
    }

    const createdAnswer = await this.dataSource.transaction(
      async (entityManager) => {
        const status = unansweredQuestion.question.keys.includes(dto.answer)
          ? AnswerStatus.Correct
          : AnswerStatus.Incorrect;

        const answer = Answer.create({
          playerProgressId: playerProgress?.id,
          questionId: unansweredQuestion.questionId,
          text: dto.answer,
          status,
        });

        return entityManager.save(answer);
      },
    );

    this.eventBus.publish(
      new AnswerAddedEvent(
        createdAnswer.id,
        playerProgress.id,
        playerProgress.game.id,
      ),
    );

    return createdAnswer.id;
  }
}
