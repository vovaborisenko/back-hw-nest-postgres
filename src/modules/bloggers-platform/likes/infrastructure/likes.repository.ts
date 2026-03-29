import { Injectable } from '@nestjs/common';
import { Like, LikeDocument, type LikeModelType } from '../domain/like.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Injectable()
export class LikesRepository {
  constructor(
    @InjectModel(Like.name) private readonly LikeModel: LikeModelType,
  ) {}

  async save(doc: LikeDocument): Promise<void> {
    await doc.save();
  }

  findByAuthorAndParent(
    authorId: string | Types.ObjectId,
    parentId: string | Types.ObjectId,
  ): Promise<LikeDocument | null> {
    return this.LikeModel.findOne({
      author: new Types.ObjectId(authorId),
      parent: new Types.ObjectId(parentId),
    });
  }
}
