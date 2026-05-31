import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateQuestionDto } from '../../dto/create-question.dto';
import { QuestionRepository } from '../../infrastructure/question.repository';

export class CreateQuestionCommand extends Command<number> {
  constructor(public readonly dto: CreateQuestionDto) {
    super();
  }
}

@CommandHandler(CreateQuestionCommand)
export class CreateQuestionUseCase implements ICommandHandler<CreateQuestionCommand> {
  constructor(public readonly repository: QuestionRepository) {}

  async execute({ dto }: CreateQuestionCommand): Promise<number> {
    return this.repository.create(dto);
  }
}
