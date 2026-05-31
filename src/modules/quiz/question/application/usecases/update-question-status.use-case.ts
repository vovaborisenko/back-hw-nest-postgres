import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QuestionRepository } from '../../infrastructure/question.repository';
import { UpdateQuestionStatusDto } from '../../dto/update-question-status.dto';

export class UpdateQuestionStatusCommand extends Command<void> {
  constructor(
    public readonly id: number,
    public readonly dto: UpdateQuestionStatusDto,
  ) {
    super();
  }
}

@CommandHandler(UpdateQuestionStatusCommand)
export class UpdateQuestionStatusUseCase implements ICommandHandler<UpdateQuestionStatusCommand> {
  constructor(public readonly repository: QuestionRepository) {}

  async execute({ id, dto }: UpdateQuestionStatusCommand): Promise<void> {
    return this.repository.updateStatus(id, dto);
  }
}
