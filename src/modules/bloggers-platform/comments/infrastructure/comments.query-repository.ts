import { Injectable } from '@nestjs/common';
import { CommentViewDto } from '../api/view-dto/comment.view-dto';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-code';
import { BasePaginatedViewDto } from '../../../../core/api/view-dto/base.paginated.view-dto';
import { GetCommentsQueryParamsInputDto } from '../api/input-dto/get-comments.query-params.input-dto';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsOrder, FindOptionsWhere, Repository } from 'typeorm';
import { LikeParent } from '../../likes/enums/like-parent';
import { LikeStatus } from '../../likes/enums/like-status';
import { Comment } from '../domain/comment.entity';
import { Like } from '../../likes/domain/like.entity';

@Injectable()
export class CommentsQueryRepository {
  constructor(
    @InjectRepository(Comment)
    private readonly commentsRepo: Repository<Comment>,
    @InjectRepository(Like) private readonly likeRepo: Repository<Like>,
  ) {}

  async findMany(
    query: GetCommentsQueryParamsInputDto,
    postId?: number,
    likeAuthorId: number | null = null,
  ): Promise<BasePaginatedViewDto<CommentViewDto[]>> {
    const where: FindOptionsWhere<Comment> = {};
    const order: FindOptionsOrder<Comment> = {};

    if (postId) {
      where.post = { id: postId };
    }

    if (query.sortBy) {
      order[query.sortBy] = query.sortDirection;
    }

    const [items, count] = await this.commentsRepo.findAndCount({
      where,
      skip: query.skip,
      take: query.pageSize,
      order: {
        ...order,
        createdAt: query.sortDirection,
      },
      relations: {
        post: true,
        author: true,
      },
    });

    const map = await Promise.all(
      items.map(({ id }) =>
        Promise.all([
          this.findLikeStatusByAuthorId(id, likeAuthorId),
          this.countLikesByStatus(id, LikeStatus.Like),
          this.countLikesByStatus(id, LikeStatus.Dislike),
        ]),
      ),
    );

    return BasePaginatedViewDto.mapToView({
      page: query.pageNumber,
      size: query.pageSize,
      totalCount: Number(count),
      items: items.map((item, index) =>
        CommentViewDto.mapToView(item, ...map[index]),
      ),
    });
  }

  async findById(
    id: number,
    likeAuthorId: number | null = null,
  ): Promise<CommentViewDto | null> {
    const [comment, myLikeStatus, likesCount, dislikesCount] =
      await Promise.all([
        this.commentsRepo.findOne({
          where: { id },
          relations: {
            post: true,
            author: true,
          },
        }),
        this.findLikeStatusByAuthorId(id, likeAuthorId),
        this.countLikesByStatus(id, LikeStatus.Like),
        this.countLikesByStatus(id, LikeStatus.Dislike),
      ]);

    return comment
      ? CommentViewDto.mapToView(
          comment,
          myLikeStatus,
          likesCount,
          dislikesCount,
        )
      : null;
  }

  async findByIdOrNotFoundFail(
    id: number,
    likeAuthorId?: number,
  ): Promise<CommentViewDto> {
    const comment = await this.findById(id, likeAuthorId);

    if (!comment) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Comment not found',
      });
    }

    return comment;
  }

  async findLikeStatusByAuthorId(
    postId: number,
    authorId?: number | null,
  ): Promise<LikeStatus> {
    if (!authorId) {
      return LikeStatus.None;
    }

    const like = await this.likeRepo.findOneBy({
      parentId: postId,
      parentType: LikeParent.Comments,
      authorId,
    });

    return like?.status || LikeStatus.None;
  }

  countLikesByStatus(postId: number, status: LikeStatus): Promise<number> {
    return this.likeRepo.countBy({
      parentId: postId,
      parentType: LikeParent.Comments,
      status,
    });
  }
}
