import { Injectable } from '@nestjs/common';
import { CommentViewDto } from '../api/view-dto/comment.view-dto';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-code';
import { BasePaginatedViewDto } from '../../../../core/api/view-dto/base.paginated.view-dto';
import { GetCommentsQueryParamsInputDto } from '../api/input-dto/get-comments.query-params.input-dto';
import { CommentViewRaw } from './dto/comment.aggregated-dto';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CommentsSortBy } from '../api/input-dto/comments.sort-by';
import { LikeParent } from '../../likes/enums/like-parent';
import { LikeStatus } from '../../likes/enums/like-status';

@Injectable()
export class CommentsQueryRepository {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async findMany(
    query: GetCommentsQueryParamsInputDto,
    postId?: number,
    likeAuthorId: number | null = null,
  ): Promise<BasePaginatedViewDto<CommentViewDto[]>> {
    const nameFilter = postId ? `post_id = ${postId}` : '';
    const defaultFilter = 'comments.deleted_at is NULL';
    const filter = [nameFilter, defaultFilter].filter(Boolean).join(' AND ');
    const sortField = this.getSortBy(query.sortBy);
    const sortByQuery = query.sortBy
      ? `${sortField} ${query.sortDirection}`
      : '';
    const sortByDefault = `id ${query.sortDirection}`;
    const orderBy = [sortByQuery, sortByDefault].filter(Boolean).join(', ');

    const dataQuery = this.dataSource.query<CommentViewRaw[]>(
      `
      SELECT 
        comments.*, 
        users.login as user_login,

        -- Статус текущего пользователя
        user_like.status as user_like_status,

        -- Счетчики лайков/дизлайков из подзапроса
        COALESCE(likes_stats.likes_count, 0) as likes_count,
        COALESCE(likes_stats.dislikes_count, 0) as dislikes_count
      
      FROM comments
      JOIN users ON users.id = comments.user_id
        
      -- LEFT JOIN для статуса конкретного пользователя
      LEFT JOIN likes user_like ON user_like.user_id = $3
        AND user_like.parent_id = comments.id
        AND user_like.parent_entity = $4

      -- LEFT JOIN для общей статистики
      LEFT JOIN (
        SELECT
          parent_id,
          COUNT(*) FILTER (WHERE status = $5)::INT AS likes_count,
          COUNT(*) FILTER (WHERE status = $6)::INT AS dislikes_count
        FROM likes
        WHERE parent_entity = $4
        GROUP BY parent_id
      ) likes_stats ON likes_stats.parent_id = comments.id

      WHERE ${filter} 
      ORDER BY ${orderBy} 
      LIMIT $1 
      OFFSET $2    `,
      [
        query.pageSize,
        query.skip,
        likeAuthorId,
        LikeParent.Comments,
        LikeStatus.Like,
        LikeStatus.Dislike,
      ],
    );
    const countQuery = this.dataSource.query<[{ count: string }]>(
      `
      SELECT COUNT(*) 
      FROM comments 
      WHERE ${filter}
    `,
    );

    const [items, [{ count }]] = await Promise.all([dataQuery, countQuery]);

    return BasePaginatedViewDto.mapToView({
      page: query.pageNumber,
      size: query.pageSize,
      totalCount: Number(count),
      items: items.map((item) => CommentViewDto.mapToView(item)),
    });
  }

  async findById(
    id: number,
    likeAuthorId: number | null = null,
  ): Promise<CommentViewDto | null> {
    const [comment = null] = await this.dataSource.query<CommentViewRaw[]>(
      `
        SELECT 
          comments.*, 
          users.login as user_login,
          
          -- Статус текущего пользователя
          user_like.status as user_like_status,

          -- Счетчики лайков/дизлайков из подзапроса
          COALESCE(likes_stats.likes_count, 0) as likes_count,
          COALESCE(likes_stats.dislikes_count, 0) as dislikes_count

        FROM comments 

        JOIN users ON users.id = comments.user_id

        -- LEFT JOIN для статуса конкретного пользователя
        LEFT JOIN likes user_like ON user_like.user_id = $2
          AND user_like.parent_id = comments.id
          AND user_like.parent_entity = $3

        -- LEFT JOIN для общей статистики
        LEFT JOIN (
          SELECT
            parent_id,
            COUNT(*) FILTER (WHERE status = $4)::INT AS likes_count,
            COUNT(*) FILTER (WHERE status = $5)::INT AS dislikes_count
          FROM likes
          WHERE parent_entity = $3
          GROUP BY parent_id
        ) likes_stats ON likes_stats.parent_id = comments.id
      
        WHERE comments.id = $1 
          AND comments.deleted_at is NULL

        ORDER BY comments.id
      `,
      [
        id,
        likeAuthorId,
        LikeParent.Comments,
        LikeStatus.Like,
        LikeStatus.Dislike,
      ],
    );

    return comment ? CommentViewDto.mapToView(comment) : null;
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

  private getSortBy(querySortBy: CommentsSortBy): string {
    return querySortBy.replace(/([A-Z])/g, '_$1');
  }
}
