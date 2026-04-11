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
      SELECT posts.*, blogs.name as blog_name
      FROM posts
      JOIN blogs ON blogs.id = posts.blog_id
      WHERE ${filter} 
      ORDER BY ${orderBy} 
      LIMIT $1 
      OFFSET $2    `,
      [query.pageSize, query.skip],
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
        SELECT posts.*, blogs.name as blog_name
        FROM posts 
        JOIN blogs ON blogs.id = posts.blog_id
        WHERE posts.id = $1 AND posts.deleted_at is NULL
      `,
      [id],
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
