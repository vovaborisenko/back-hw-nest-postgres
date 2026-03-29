import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Post, PostDocument, type PostModelType } from '../domain/post.entity';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-code';
import { Types } from 'mongoose';

@Injectable()
export class PostsRepository {
  constructor(@InjectModel(Post.name) private PostModel: PostModelType) {}

  findById(id: string | Types.ObjectId): Promise<PostDocument | null> {
    return this.PostModel.findById(id).where({ deletedAt: null });
  }

  async findByIdOrNotFound(id: string | Types.ObjectId): Promise<PostDocument> {
    const post = await this.findById(id);

    if (!post) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Post not found',
      });
    }

    return post;
  }

  async save(post: PostDocument): Promise<void> {
    await post.save();
  }
}
