import { QueryFilter, Types } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Blog, BlogDocument } from '../domain/blog.entity';
import type { BlogModelType } from '../domain/blog.entity';
import { BlogViewDto } from '../api/view-dto/blog.view-dto';
import { BasePaginatedViewDto } from '../../../../core/api/view-dto/base.paginated.view-dto';
import { GetBlogsQueryParamsInputDto } from '../api/input-dto/get-blogs.query-params.input-dto';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-code';

@Injectable()
export class BlogsQueryRepository {
  constructor(@InjectModel(Blog.name) private BlogModel: BlogModelType) {}

  async getAll(
    query: GetBlogsQueryParamsInputDto,
  ): Promise<BasePaginatedViewDto<BlogViewDto[]>> {
    const skip = query.skip;
    const sort = {
      [query.sortBy]: query.sortDirection,
      _id: query.sortDirection,
    };
    const filter: QueryFilter<BlogDocument> = {};

    if (query.searchNameTerm) {
      filter.name = { $regex: query.searchNameTerm, $options: 'i' };
    }

    const [items, totalCount] = await Promise.all([
      this.BlogModel.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(query.pageSize)
        .lean(),
      this.BlogModel.countDocuments(filter),
    ]);

    return BasePaginatedViewDto.mapToView({
      page: query.pageNumber,
      size: query.pageSize,
      totalCount,
      items: items.map((item) => BlogViewDto.mapToView(item)),
    });
  }

  findById(id: string | Types.ObjectId): Promise<BlogDocument | null> {
    return this.BlogModel.findById(id).where({
      deletedAt: null,
    });
  }

  async getByIdOrNotFoundFail(
    id: string | Types.ObjectId,
  ): Promise<BlogViewDto> {
    const blog = await this.findById(id);

    if (!blog) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Blog not found',
      });
    }

    return BlogViewDto.mapToView(blog);
  }
}
