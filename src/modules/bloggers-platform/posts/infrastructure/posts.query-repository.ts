import { Injectable } from '@nestjs/common';
import { PostViewDto } from '../api/view-dto/post.view-dto';
import { BasePaginatedViewDto } from '../../../../core/api/view-dto/base.paginated.view-dto';
import { GetPostsQueryParamsInputDto } from '../api/input-dto/get-posts.query-params.input-dto';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-code';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  FindOptionsOrder,
  FindOptionsWhere,
  Repository,
} from 'typeorm';
import { Post } from '../domain/post.entity';
import { PostsSortBy } from '../api/input-dto/posts.sort-by';

@Injectable()
export class PostsQueryRepository {
  constructor(
    @InjectRepository(Post) private readonly postRepo: Repository<Post>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async getAll(
    query: GetPostsQueryParamsInputDto,
    options?: {
      blogId?: number;
      likeAuthorId?: number;
    },
  ): Promise<BasePaginatedViewDto<PostViewDto[]>> {
    const where: FindOptionsWhere<Post> = {};
    const order: FindOptionsOrder<Post> = {};

    if (options?.blogId) {
      where.blog = { id: options?.blogId };
    }

    if (query.sortBy === PostsSortBy.blogName) {
      order.blog = { name: query.sortDirection };
    } else if (query.sortBy) {
      order[query.sortBy] = query.sortDirection;
    }

    const [items, count] = await this.postRepo.findAndCount({
      where,
      skip: query.skip,
      take: query.pageSize,
      order: {
        ...order,
        id: query.sortDirection,
      },
      relations: { blog: true },
    });

    return BasePaginatedViewDto.mapToView({
      page: query.pageNumber,
      size: query.pageSize,
      totalCount: Number(count),
      items: items.map((item) => PostViewDto.mapToView(item)),
    });
  }

  async findById(
    id: number,
    likeAuthorId?: number,
  ): Promise<PostViewDto | null> {
    const post = await this.postRepo.findOne({
      where: { id },
      relations: { blog: true },
    });

    return post ? PostViewDto.mapToView(post) : null;
  }

  async getByIdOrNotFoundFail(
    id: number,
    likeAuthorId?: number,
  ): Promise<PostViewDto> {
    const post = await this.findById(id, likeAuthorId);

    if (!post) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Post not found',
      });
    }

    return post;
  }
}
