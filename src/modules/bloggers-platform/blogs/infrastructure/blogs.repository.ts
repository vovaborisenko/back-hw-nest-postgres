import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Blog, BlogDocument, type BlogModelType } from '../domain/blog.entity';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-code';

@Injectable()
export class BlogsRepository {
  constructor(@InjectModel(Blog.name) private BlogModel: BlogModelType) {}

  findById(id: string): Promise<BlogDocument | null> {
    return this.BlogModel.findById(id).where({ deletedAt: null });
  }

  async findByIdOrNotFound(id: string): Promise<BlogDocument> {
    const blog = await this.findById(id);

    if (!blog) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Blog not found',
      });
    }

    return blog;
  }

  async save(blog: BlogDocument): Promise<void> {
    await blog.save();
  }
}
