import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreatePostDto } from '../../dto/create-post.dto';
import { PostsRepository } from '../../infrastructure/posts.repository';

export class CreatePostCommand extends Command<number> {
  constructor(public readonly dto: CreatePostDto) {
    super();
  }
}

@CommandHandler(CreatePostCommand)
export class CreatePostUseCase implements ICommandHandler<CreatePostCommand> {
  constructor(protected readonly repository: PostsRepository) {}

  execute({ dto }: CreatePostCommand): Promise<number> {
    return this.repository.createPost(dto);
  }
}
