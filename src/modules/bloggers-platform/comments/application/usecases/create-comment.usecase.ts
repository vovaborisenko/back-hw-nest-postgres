import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateCommentDto } from '../../dto/create-comment.dto';
import { CommentsRepository } from '../../infrastructure/comments.repository';
import { PostsRepository } from '../../../posts/infrastructure/posts.repository';

export class CreateCommentCommand extends Command<{
  commentId: number;
}> {
  constructor(public readonly dto: CreateCommentDto) {
    super();
  }
}

@CommandHandler(CreateCommentCommand)
export class CreateCommentUseCase implements ICommandHandler<CreateCommentCommand> {
  constructor(
    private readonly commentsRepository: CommentsRepository,
    private readonly postsRepository: PostsRepository,
  ) {}
  async execute({ dto }: CreateCommentCommand): Promise<{ commentId: number }> {
    await this.postsRepository.findByIdOrNotFound(dto.postId);

    const commentId = await this.commentsRepository.createComment(dto);

    return { commentId };
  }
}
