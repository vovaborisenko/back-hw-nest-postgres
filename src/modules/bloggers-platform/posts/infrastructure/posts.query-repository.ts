import { Injectable } from '@nestjs/common';
import { PostViewDto } from '../api/view-dto/post.view-dto';
import { BasePaginatedViewDto } from '../../../../core/api/view-dto/base.paginated.view-dto';
import { GetPostsQueryParamsInputDto } from '../api/input-dto/get-posts.query-params.input-dto';
import { PostsSortBy } from '../api/input-dto/posts.sort-by';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-code';
import { PostViewRaw } from './dto/post.aggregated-dto';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { LikeParent } from '../../likes/enums/like-parent';
import { LikeStatus } from '../../likes/enums/like-status';

@Injectable()
export class PostsQueryRepository {
  constructor(
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
    const nameFilter = options?.blogId ? `blog_id = ${options.blogId}` : '';
    const defaultFilter = 'posts.deleted_at is NULL';
    const filter = [nameFilter, defaultFilter].filter(Boolean).join(' AND ');
    const sortField = this.getSortBy(query.sortBy);
    const sortByQuery = query.sortBy
      ? `${sortField} ${query.sortDirection}`
      : '';
    const sortByDefault = `id ${query.sortDirection}`;
    const orderBy = [sortByQuery, sortByDefault].filter(Boolean).join(', ');

    const dataQuery = this.dataSource.query<PostViewRaw[]>(
      `
      SELECT 
        posts.*, 
        blogs.name as blog_name,

        -- Статус текущего пользователя
        user_like.status as user_like_status,

        -- Счетчики лайков/дизлайков из подзапроса
        COALESCE(likes_stats.likes_count, 0) as likes_count,
        COALESCE(likes_stats.dislikes_count, 0) as dislikes_count,

        -- 3 последних лайка через LATERAL
        COALESCE(newest.newest_likes, '[]'::JSON) as newest_likes

      FROM posts
        
      JOIN blogs ON blogs.id = posts.blog_id

        -- LEFT JOIN для статуса конкретного пользователя
      LEFT JOIN likes user_like ON user_like.user_id = $3
        AND user_like.parent_id = posts.id
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
      ) likes_stats ON likes_stats.parent_id = posts.id

      -- LATERAL JOIN для 3 последних лайков
      LEFT JOIN LATERAL (
        SELECT JSON_AGG(
          JSON_BUILD_OBJECT(
            'addedAt', limited.created_at,
            'userId', limited.user_id,
            'login', limited.login
          )
          
          ) as newest_likes

        FROM (SELECT l.created_at, l.user_id, u.login
              FROM likes l
              JOIN users u ON u.id = l.user_id

              WHERE l.parent_id = posts.id
                AND l.parent_entity = $4
                AND l.status = $5 -- только лайки, не дизлайки

              ORDER BY l.created_at DESC
              LIMIT 3) limited
      ) newest ON true
      
      WHERE ${filter} 
      ORDER BY ${orderBy} 
      LIMIT $1 
      OFFSET $2    `,
      [
        query.pageSize,
        query.skip,
        options?.likeAuthorId || null,
        LikeParent.Posts,
        LikeStatus.Like,
        LikeStatus.Dislike,
      ],
    );
    const countQuery = this.dataSource.query<[{ count: string }]>(
      `
      SELECT COUNT(*) 
      FROM posts 
      WHERE ${filter}
    `,
    );

    const [items, [{ count }]] = await Promise.all([dataQuery, countQuery]);

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
    const [post = null] = await this.dataSource.query<PostViewRaw[]>(
      `
        SELECT 
          posts.*, 
          blogs.name as blog_name,

          -- Статус текущего пользователя
          user_like.status as user_like_status,

          -- Счетчики лайков/дизлайков из подзапроса
          COALESCE(likes_stats.likes_count, 0) as likes_count,
          COALESCE(likes_stats.dislikes_count, 0) as dislikes_count,

          -- Новое: 3 последних лайка через LATERAL
          COALESCE(newest.newest_likes, '[]'::JSON) as newest_likes

        FROM posts 
        JOIN blogs ON blogs.id = posts.blog_id

        -- LEFT JOIN для статуса конкретного пользователя
        LEFT JOIN likes user_like ON user_like.user_id = $2
          AND user_like.parent_id = posts.id
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
        ) likes_stats ON likes_stats.parent_id = posts.id

        -- LATERAL JOIN для 3 последних лайков
        LEFT JOIN LATERAL (
          SELECT JSON_AGG(
                   JSON_BUILD_OBJECT(
                     'addedAt', limited.created_at,
                     'userId', limited.user_id,
                     'login', limited.login
                   )

                 ) as newest_likes

          FROM (SELECT l.created_at, l.user_id, u.login
                FROM likes l
                       JOIN users u ON u.id = l.user_id

                WHERE l.parent_id = posts.id
                  AND l.parent_entity = $3
                  AND l.status = $4 -- только лайки, не дизлайки

                ORDER BY l.created_at DESC
                LIMIT 3) limited
          ) newest ON true

        WHERE posts.id = $1 AND posts.deleted_at is NULL
      `,
      [id, likeAuthorId, LikeParent.Posts, LikeStatus.Like, LikeStatus.Dislike],
    );

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

  private getSortBy(querySortBy: PostsSortBy): string {
    if (querySortBy === PostsSortBy.ShortDescription) {
      return 'excerpt';
    }

    return querySortBy === PostsSortBy.blogName
      ? 'blog_name'
      : querySortBy.replace(/([A-Z])/g, '_$1');
  }

  // private getAggregatedPosts(
  //   filter: QueryFilter<PostDocument>,
  //   likeAuthorId?: number,
  // ): Aggregate<AggregatedPostDto[]> {
  //   return (
  //     this.PostModel.aggregate<AggregatedPostDto>()
  //       .match(filter)
  //       .lookup({
  //         from: 'blogs',
  //         localField: 'blog',
  //         foreignField: '_id',
  //         as: 'blog',
  //       })
  //       .unwind({
  //         path: '$blog',
  //         preserveNullAndEmptyArrays: true,
  //       })
  //       .addFields({
  //         blog: {
  //           $cond: {
  //             if: { $eq: ['$blog', null] },
  //             then: { _id: '$blog' },
  //             else: '$blog',
  //           },
  //         },
  //       }) // Получаем все лайки для комментария
  //       .lookup({
  //         from: 'likes',
  //         let: { commentId: '$_id' },
  //         pipeline: [
  //           {
  //             $match: {
  //               $expr: {
  //                 $and: [{ $eq: ['$parent', '$$commentId'] }],
  //               },
  //             },
  //           },
  //           // Сортируем по дате создания (новые сверху)
  //           { $sort: { createdAt: -1 } },
  //
  //           // Добавляем информацию о пользователях для newestLikes
  //           {
  //             $lookup: {
  //               from: 'users',
  //               localField: 'author',
  //               foreignField: '_id',
  //               as: 'userDetails',
  //             },
  //           },
  //           {
  //             $addFields: {
  //               user: { $arrayElemAt: ['$userDetails', 0] },
  //             },
  //           },
  //           {
  //             $project: {
  //               userDetails: 0,
  //             },
  //           },
  //         ],
  //         as: 'allLikes',
  //       })
  //       .addFields({
  //         // Формируем extendedLikesInfo
  //         extendedLikesInfo: {
  //           // Общее количество лайков
  //           likesCount: {
  //             $size: {
  //               $filter: {
  //                 input: '$allLikes',
  //                 as: 'like',
  //                 cond: { $eq: ['$$like.status', LikeStatus.Like] },
  //               },
  //             },
  //           },
  //           // Общее количество дизлайков
  //           dislikesCount: {
  //             $size: {
  //               $filter: {
  //                 input: '$allLikes',
  //                 as: 'like',
  //                 cond: { $eq: ['$$like.status', LikeStatus.Dislike] },
  //               },
  //             },
  //           },
  //           // Статус текущего пользователя
  //           myStatus: likeAuthorId
  //             ? {
  //                 $ifNull: [
  //                   {
  //                     $arrayElemAt: [
  //                       {
  //                         $map: {
  //                           input: {
  //                             $filter: {
  //                               input: '$allLikes',
  //                               as: 'like',
  //                               cond: {
  //                                 $eq: [
  //                                   '$$like.author',
  //                                   new Types.ObjectId(likeAuthorId),
  //                                 ],
  //                               },
  //                             },
  //                           },
  //                           as: 'like',
  //                           in: '$$like.status',
  //                         },
  //                       },
  //                       0,
  //                     ],
  //                   },
  //                   LikeStatus.None,
  //                 ],
  //               }
  //             : LikeStatus.None,
  //
  //           // Последние 3 лайка с деталями
  //           newestLikes: {
  //             $map: {
  //               input: {
  //                 $slice: [
  //                   {
  //                     $filter: {
  //                       input: '$allLikes',
  //                       as: 'like',
  //                       cond: { $eq: ['$$like.status', LikeStatus.Like] },
  //                     },
  //                   },
  //                   0,
  //                   3,
  //                 ],
  //               },
  //               as: 'like',
  //               in: {
  //                 addedAt: '$$like.createdAt',
  //                 userId: { $toString: '$$like.author' },
  //                 login: '$$like.user.login', // предполагаем, что в user есть поле login
  //               },
  //             },
  //           },
  //         },
  //       })
  //       // Убираем временное поле allLikes
  //       .project({
  //         allLikes: 0,
  //       })
  //   );
  // }
}
