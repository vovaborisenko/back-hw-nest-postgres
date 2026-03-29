import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model, Types } from 'mongoose';
import { Post } from '../../posts/domain/post.entity';
import { User } from '../../../user-accounts/domain/user.entity';
import { CreateCommentDomainDto } from './dto/create-comment.domain-dto';
import { UpdateCommentDomainDto } from './dto/update-comment.domain-dto';

@Schema({ timestamps: true })
export class Comment {
  @Prop({ type: String, required: true })
  content: string;

  @Prop({ type: Types.ObjectId, ref: Post.name, required: true })
  post: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  author: Types.ObjectId;

  createdAt: Date;

  @Prop({ type: Date, nullable: true, default: null })
  deletedAt: Date | null;

  static createInstance(dto: CreateCommentDomainDto) {
    const comment = new this();

    comment.content = dto.content;
    comment.post = new Types.ObjectId(dto.post);
    comment.author = new Types.ObjectId(dto.author);

    return comment as CommentDocument;
  }

  update(dto: UpdateCommentDomainDto): void {
    this.content = dto.content || this.content;
  }

  makeDeleted(): void {
    if (this.deletedAt !== null) {
      throw new Error('Entity already deleted');
    }

    this.deletedAt = new Date();
  }
}

export const CommentSchema = SchemaFactory.createForClass(Comment);

CommentSchema.loadClass(Comment);

export type CommentDocument = HydratedDocument<Comment>;
export type CommentModelType = Model<CommentDocument> & typeof Comment;
