import { Injectable } from '@nestjs/common';
import { Blog } from '../domain/blog.entity';
import { BlogViewDto } from '../api/view-dto/blog.view-dto';
import { BasePaginatedViewDto } from '../../../../core/api/view-dto/base.paginated.view-dto';
import { GetBlogsQueryParamsInputDto } from '../api/input-dto/get-blogs.query-params.input-dto';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-code';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsOrder, FindOptionsWhere, ILike, Repository } from 'typeorm';

@Injectable()
export class BlogsQueryRepository {
  constructor(
    @InjectRepository(Blog)
    private readonly blogRepo: Repository<Blog>,
  ) {}

  async getAll(
    query: GetBlogsQueryParamsInputDto,
  ): Promise<BasePaginatedViewDto<BlogViewDto[]>> {
    const where: FindOptionsWhere<Blog>[] = [];
    const order: FindOptionsOrder<Blog> = {};

    if (query.searchNameTerm) {
      where.push({ name: ILike(`%${query.searchNameTerm}%`) });
    }

    if (query.sortBy) {
      order[query.sortBy] = query.sortDirection;
    }

    const [items, count] = await this.blogRepo.findAndCount({
      where,
      skip: query.skip,
      take: query.pageSize,
      order: {
        ...order,
        id: query.sortDirection,
      },
    });

    return BasePaginatedViewDto.mapToView({
      page: query.pageNumber,
      size: query.pageSize,
      totalCount: Number(count),
      items: items.map((item) => BlogViewDto.mapToView(item)),
    });
  }

  findById(id: number): Promise<Blog | null> {
    return this.blogRepo.findOneBy({ id });
  }

  async getByIdOrNotFoundFail(id: number): Promise<BlogViewDto> {
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
