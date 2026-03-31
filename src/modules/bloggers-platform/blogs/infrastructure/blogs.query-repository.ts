import { Injectable } from '@nestjs/common';
import { BlogRaw } from '../domain/blog.entity';
import { BlogViewDto } from '../api/view-dto/blog.view-dto';
import { BasePaginatedViewDto } from '../../../../core/api/view-dto/base.paginated.view-dto';
import { GetBlogsQueryParamsInputDto } from '../api/input-dto/get-blogs.query-params.input-dto';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-code';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class BlogsQueryRepository {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async getAll(
    query: GetBlogsQueryParamsInputDto,
  ): Promise<BasePaginatedViewDto<BlogViewDto[]>> {
    const nameFilter = query.searchNameTerm
      ? `name ILIKE '%${query.searchNameTerm}%'`
      : '';
    const defaultFilter = 'deleted_at is NULL';
    const filter = [nameFilter, defaultFilter].filter(Boolean).join(' AND ');
    const sortField = query.sortBy.replace(/([A-Z])/g, '_$1');
    const sortByQuery = query.sortBy
      ? `${sortField} ${query.sortDirection}`
      : '';
    const sortByDefault = `id ${query.sortDirection}`;
    const orderBy = [sortByQuery, sortByDefault].filter(Boolean).join(', ');

    const dataQuery = this.dataSource.query<BlogRaw[]>(
      `
      SELECT * 
      FROM blogs 
      WHERE ${filter} 
      ORDER BY ${orderBy} 
      LIMIT $1 
      OFFSET $2    `,
      [query.pageSize, query.skip],
    );
    const countQuery = this.dataSource.query<[{ count: string }]>(
      `
      SELECT COUNT(*) 
      FROM blogs 
      WHERE ${filter}
    `,
    );

    const [items, [{ count }]] = await Promise.all([dataQuery, countQuery]);

    return BasePaginatedViewDto.mapToView({
      page: query.pageNumber,
      size: query.pageSize,
      totalCount: Number(count),
      items: items.map((item) => BlogViewDto.mapToView(item)),
    });
  }

  async findById(id: number): Promise<BlogRaw | null> {
    const [blog = null] = await this.dataSource.query<BlogRaw[]>(
      `
        SELECT * 
        FROM blogs 
        WHERE id = $1 AND deleted_at is NULL
      `,
      [id],
    );

    return blog;
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
