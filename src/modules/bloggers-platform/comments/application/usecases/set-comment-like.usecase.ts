import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SetLikeCommand } from '../../../likes/application/usecases/set-like.usecase';
import { SetLikeDto } from '../../../likes/dto/set-like.dto';
import { CommentsRepository } from '../../infrastructure/comments.repository';

export class SetCommentLikeCommand extends SetLikeCommand {
  constructor(public readonly dto: SetLikeDto) {
    super(dto);
  }
}

@CommandHandler(SetCommentLikeCommand)
export class SetCommentLikeUseCase implements ICommandHandler<SetCommentLikeCommand> {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly commentsRepository: CommentsRepository,
  ) {}

  async execute({ dto }: SetCommentLikeCommand): Promise<void> {
    await this.commentsRepository.findByIdOrNotFound(dto.parent);
    await this.commandBus.execute(new SetLikeCommand(dto));
  }
}
