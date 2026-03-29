import { CreateCommentDto } from '../../dto/create-comment.dto';
import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Types } from 'mongoose';
import { Comment, type CommentModelType } from '../../domain/comment.entity';
import { InjectModel } from '@nestjs/mongoose';
import { CommentsRepository } from '../../infrastructure/comments.repository';
import { PostsRepository } from '../../../posts/infrastructure/posts.repository';

export class CreateCommentCommand extends Command<{
  commentId: Types.ObjectId;
}> {
  constructor(public readonly dto: CreateCommentDto) {
    super();
  }
}

@CommandHandler(CreateCommentCommand)
export class CreateCommentUseCase implements ICommandHandler<CreateCommentCommand> {
  constructor(
    @InjectModel(Comment.name)
    private CommentModel: CommentModelType,
    private readonly commentsRepository: CommentsRepository,
    private readonly postsRepository: PostsRepository,
  ) {}
  async execute({
    dto,
  }: CreateCommentCommand): Promise<{ commentId: Types.ObjectId }> {
    await this.postsRepository.findByIdOrNotFound(dto.post);

    const comment = this.CommentModel.createInstance(dto);

    await this.commentsRepository.save(comment);

    return { commentId: comment._id };
  }
}
