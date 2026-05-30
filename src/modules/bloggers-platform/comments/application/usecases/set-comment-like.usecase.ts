import {
  Command,
  CommandBus,
  CommandHandler,
  ICommandHandler,
} from '@nestjs/cqrs';
import { SetLikeCommand } from '../../../likes/application/usecases/set-like.usecase';
import { SetLikeDto } from '../../../likes/dto/set-like.dto';
import { CommentsRepository } from '../../infrastructure/comments.repository';
import { LikeParent } from '../../../likes/enums/like-parent';

export class SetCommentLikeCommand extends Command<void> {
  constructor(public readonly dto: Omit<SetLikeDto, 'parentType'>) {
    super();
  }
}

@CommandHandler(SetCommentLikeCommand)
export class SetCommentLikeUseCase implements ICommandHandler<SetCommentLikeCommand> {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly commentsRepository: CommentsRepository,
  ) {}

  async execute({ dto }: SetCommentLikeCommand): Promise<void> {
    await this.commentsRepository.findByIdOrNotFound(dto.parentId);
    await this.commandBus.execute(
      new SetLikeCommand({ ...dto, parentType: LikeParent.Comments }),
    );
  }
}
