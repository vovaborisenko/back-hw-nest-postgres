import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateCommentDto } from '../../dto/update-comment.dto';
import { CommentsRepository } from '../../infrastructure/comments.repository';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-code';

export class UpdateCommentCommand extends Command<{
  commentId: number;
}> {
  constructor(
    public readonly dto: UpdateCommentDto,
    public readonly commentId: number,
    public readonly userId: number,
  ) {
    super();
  }
}

@CommandHandler(UpdateCommentCommand)
export class UpdateCommentUseCase implements ICommandHandler<UpdateCommentCommand> {
  constructor(private readonly commentsRepository: CommentsRepository) {}

  async execute({
    dto,
    commentId,
    userId,
  }: UpdateCommentCommand): Promise<{ commentId: number }> {
    const comment = await this.commentsRepository.findByIdOrNotFound(commentId);

    if (comment.author.id.toString() !== userId.toString()) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'User is not comment owner',
      });
    }

    await this.commentsRepository.updateComment(commentId, dto);

    return { commentId: comment.id };
  }
}
