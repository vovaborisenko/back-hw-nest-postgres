import {
  Command,
  CommandBus,
  CommandHandler,
  ICommandHandler,
} from '@nestjs/cqrs';
import { SetLikeCommand } from '../../../likes/application/usecases/set-like.usecase';
import { SetLikeDto } from '../../../likes/dto/set-like.dto';
import { PostsRepository } from '../../infrastructure/posts.repository';
import { LikeParent } from '../../../likes/enums/like-parent';

export class SetPostLikeCommand extends Command<void> {
  constructor(public readonly dto: Omit<SetLikeDto, 'parentEntity'>) {
    super();
  }
}

@CommandHandler(SetPostLikeCommand)
export class SetPostLikeUseCase implements ICommandHandler<SetPostLikeCommand> {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly postsRepository: PostsRepository,
  ) {}

  async execute({ dto }: SetPostLikeCommand): Promise<void> {
    await this.postsRepository.findByIdOrNotFound(dto.parentId);
    await this.commandBus.execute(
      new SetLikeCommand({ ...dto, parentEntity: LikeParent.Posts }),
    );
  }
}
