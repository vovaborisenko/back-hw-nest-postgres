import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CommentsRepository } from '../../infrastructure/comments.repository';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-code';

export class DeleteCommentCommand extends Command<{
  commentId: number;
}> {
  constructor(
    public readonly commentId: number,
    public readonly userId: number,
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
  }: DeleteCommentCommand): Promise<{ commentId: number }> {
    const comment = await this.commentsRepository.findByIdOrNotFound(commentId);

    if (comment.author.id.toString() !== userId.toString()) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'User is not comment owner',
      });
    }

    await this.commentsRepository.deleteComment(commentId);

    return { commentId: comment.id };
  }
}
