import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdatePostDto } from '../../dto/update-post.dto';
import { PostsRepository } from '../../infrastructure/posts.repository';

export class UpdatePostCommand extends Command<void> {
  constructor(
    public readonly id: number,
    public readonly dto: UpdatePostDto,
  ) {
    super();
  }
}

@CommandHandler(UpdatePostCommand)
export class UpdatePostUseCase implements ICommandHandler<UpdatePostCommand> {
  constructor(protected readonly repository: PostsRepository) {}

  async execute({ id, dto }: UpdatePostCommand): Promise<void> {
    return this.repository.updatePost(id, dto);
  }
}
