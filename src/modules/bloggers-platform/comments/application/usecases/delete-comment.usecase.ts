import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Types } from 'mongoose';
import { CommentsRepository } from '../../infrastructure/comments.repository';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-code';

export class DeleteCommentCommand extends Command<{
  commentId: string | Types.ObjectId;
}> {
  constructor(
    public readonly commentId: string | Types.ObjectId,
    public readonly userId: string | Types.ObjectId,
  ) {
    super();
  }
}

@CommandHandler(DeleteCommentCommand)
export class DeleteCommentUseCase implements ICommandHandler<DeleteCommentCommand> {
  constructor(private readonly commentsRepository: CommentsRepository) {}

  async execute({
    commentId,
    userId,
  }: DeleteCommentCommand): Promise<{ commentId: Types.ObjectId }> {
    const comment = await this.commentsRepository.findByIdOrNotFound(commentId);

    if (comment.author.toString() !== userId.toString()) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'User is not comment owner',
      });
    }

    comment.makeDeleted();

    await this.commentsRepository.save(comment);

    return { commentId: comment._id };
  }
}
