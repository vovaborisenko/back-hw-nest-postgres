import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model, Types } from 'mongoose';
import { LikeStatus } from '../enums/like-status';
import { User } from '../../../user-accounts/domain/user.entity';
import { CreateLikeDomainDto } from './dto/create-like.domain-dto';
import { UpdateLikeDomainDto } from './dto/update-like.domain-dto';

@Schema({ timestamps: true })
export class Like {
  @Prop({ type: String, enum: LikeStatus, required: true })
  status: LikeStatus;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  author: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  parent: Types.ObjectId;

  createdAt: Date;

  static createInstance(dto: CreateLikeDomainDto) {
    const like = new this();

    like.status = dto.status;
    like.author = new Types.ObjectId(dto.author);
    like.parent = new Types.ObjectId(dto.parent);

    return like as LikeDocument;
  }

  update(dto: UpdateLikeDomainDto) {
    this.status = dto.status;
  }
}

export const LikeSchema = SchemaFactory.createForClass(Like);

LikeSchema.loadClass(Like);

export type LikeDocument = HydratedDocument<Like>;
export type LikeModelType = Model<LikeDocument> & typeof Like;
