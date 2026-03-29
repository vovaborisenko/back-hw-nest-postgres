import { Injectable } from '@nestjs/common';
import {
  Comment,
  CommentDocument,
  type CommentModelType,
} from '../domain/comment.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-code';

@Injectable()
export class CommentsRepository {
  constructor(
    @InjectModel(Comment.name) private readonly CommentModel: CommentModelType,
  ) {}
  async save(commentDocument: CommentDocument): Promise<void> {
    await commentDocument.save();
  }

  findById(id: string | Types.ObjectId): Promise<CommentDocument | null> {
    return this.CommentModel.findById(id).where({ deletedAt: null });
  }

  async findByIdOrNotFound(
    id: string | Types.ObjectId,
  ): Promise<CommentDocument> {
    const comment = await this.findById(id);

    if (!comment) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Comment not found',
      });
    }

    return comment;
  }
}
