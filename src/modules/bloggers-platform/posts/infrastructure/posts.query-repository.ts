import { Injectable } from '@nestjs/common';
import { PostViewDto } from '../api/view-dto/post.view-dto';
import { BasePaginatedViewDto } from '../../../../core/api/view-dto/base.paginated.view-dto';
import { GetPostsQueryParamsInputDto } from '../api/input-dto/get-posts.query-params.input-dto';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-code';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsOrder, FindOptionsWhere, Repository } from 'typeorm';
import { Post } from '../domain/post.entity';
import { PostsSortBy } from '../api/input-dto/posts.sort-by';
import { Like } from '../../likes/domain/like.entity';
import { LikeParent } from '../../likes/enums/like-parent';
import { LikeStatus } from '../../likes/enums/like-status';

@Injectable()
export class PostsQueryRepository {
  constructor(
    @InjectRepository(Post) private readonly postRepo: Repository<Post>,
    @InjectRepository(Like) private readonly likeRepo: Repository<Like>,
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

    if (query.sortBy === PostsSortBy.BlogName) {
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

    const map = await Promise.all(
      items.map(({ id }) =>
        Promise.all([
          this.findPostNewestLikes(id),
          this.findPostLikeStatusByAuthorId(id, options?.likeAuthorId),
          this.countPostLikesByStatus(id, LikeStatus.Like),
          this.countPostLikesByStatus(id, LikeStatus.Dislike),
        ]),
      ),
    );

    return BasePaginatedViewDto.mapToView({
      page: query.pageNumber,
      size: query.pageSize,
      totalCount: Number(count),
      items: items.map((item, index) =>
        PostViewDto.mapToView(item, ...map[index]),
      ),
    });
  }

  async findById(
    id: number,
    likeAuthorId?: number,
  ): Promise<PostViewDto | null> {
    const [post, newestLikes, myLikeStatus, likesCount, dislikesCount] =
      await Promise.all([
        this.postRepo.findOne({
          where: { id },
          relations: { blog: true },
        }),
        this.findPostNewestLikes(id),
        this.findPostLikeStatusByAuthorId(id, likeAuthorId),
        this.countPostLikesByStatus(id, LikeStatus.Like),
        this.countPostLikesByStatus(id, LikeStatus.Dislike),
      ]);

    return post
      ? PostViewDto.mapToView(
          post,
          newestLikes,
          myLikeStatus,
          likesCount,
          dislikesCount,
        )
      : null;
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

  findPostNewestLikes(id: number): Promise<Like[]> {
    return this.likeRepo.find({
      where: {
        parentType: LikeParent.Posts,
        parentId: id,
        status: LikeStatus.Like,
      },
      order: { createdAt: -1 },
      take: 3,
      relations: { author: true },
    });
  }

  async findPostLikeStatusByAuthorId(
    postId: number,
    authorId?: number,
  ): Promise<LikeStatus> {
    if (!authorId) {
      return LikeStatus.None;
    }

    const like = await this.likeRepo.findOneBy({
      parentId: postId,
      parentType: LikeParent.Posts,
      authorId,
    });

    return like?.status || LikeStatus.None;
  }

  countPostLikesByStatus(postId: number, status: LikeStatus): Promise<number> {
    return this.likeRepo.countBy({
      parentId: postId,
      parentType: LikeParent.Posts,
      status,
    });
  }
}
