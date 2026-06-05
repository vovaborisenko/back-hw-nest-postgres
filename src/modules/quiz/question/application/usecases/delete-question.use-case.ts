import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QuestionRepository } from '../../infrastructure/question.repository';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-code';

export class DeleteQuestionCommand extends Command<void> {
  constructor(public readonly id: number) {
    super();
  }
}

@CommandHandler(DeleteQuestionCommand)
export class DeleteQuestionUseCase implements ICommandHandler<DeleteQuestionCommand> {
  constructor(public readonly repository: QuestionRepository) {}

  async execute({ id }: DeleteQuestionCommand): Promise<void> {
    const result = await this.repository.delete(id);

    if (!result) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Question not found',
      });
    }
  }
}
