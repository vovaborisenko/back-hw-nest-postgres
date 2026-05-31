import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateQuestionDto } from '../../dto/update-question.dto';
import { QuestionRepository } from '../../infrastructure/question.repository';

export class UpdateQuestionCommand extends Command<void> {
  constructor(
    public readonly id: number,
    public readonly dto: UpdateQuestionDto,
  ) {
    super();
  }
}

@CommandHandler(UpdateQuestionCommand)
export class UpdateQuestionUseCase implements ICommandHandler<UpdateQuestionCommand> {
  constructor(public readonly repository: QuestionRepository) {}

  async execute({ id, dto }: UpdateQuestionCommand): Promise<void> {
    return this.repository.update(id, dto);
  }
}
