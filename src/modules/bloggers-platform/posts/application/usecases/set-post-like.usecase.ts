import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SetLikeCommand } from '../../../likes/application/usecases/set-like.usecase';
import { SetLikeDto } from '../../../likes/dto/set-like.dto';
import { PostsRepository } from '../../infrastructure/posts.repository';

export class SetPostLikeCommand extends SetLikeCommand {
  constructor(public readonly dto: SetLikeDto) {
    super(dto);
  }
}

@CommandHandler(SetPostLikeCommand)
export class SetPostLikeUseCase implements ICommandHandler<SetPostLikeCommand> {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly postsRepository: PostsRepository,
  ) {}

  async execute({ dto }: SetPostLikeCommand): Promise<void> {
    await this.postsRepository.findByIdOrNotFound(dto.parent);
    await this.commandBus.execute(new SetLikeCommand(dto));
  }
}
