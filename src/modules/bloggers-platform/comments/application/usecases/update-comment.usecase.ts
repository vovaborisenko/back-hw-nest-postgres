import { UpdateCommentDto } from '../../dto/update-comment.dto';
import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Types } from 'mongoose';
import { CommentsRepository } from '../../infrastructure/comments.repository';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-code';

export class UpdateCommentCommand extends Command<{
  commentId: string | Types.ObjectId;
}> {
  constructor(
    public readonly dto: UpdateCommentDto,
    public readonly commentId: string | Types.ObjectId,
    public readonly userId: string | Types.ObjectId,
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
  }: UpdateCommentCommand): Promise<{ commentId: Types.ObjectId }> {
    const comment = await this.commentsRepository.findByIdOrNotFound(commentId);

    if (comment.author.toString() !== userId.toString()) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'User is not comment owner',
      });
    }

    comment.update(dto);

    await this.commentsRepository.save(comment);

    return { commentId: comment._id };
  }
}
