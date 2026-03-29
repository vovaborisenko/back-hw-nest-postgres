import { Aggregate, QueryFilter, Types } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Post, PostDocument } from '../domain/post.entity';
import type { PostModelType } from '../domain/post.entity';
import { PostViewDto } from '../api/view-dto/post.view-dto';
import { BasePaginatedViewDto } from '../../../../core/api/view-dto/base.paginated.view-dto';
import { GetPostsQueryParamsInputDto } from '../api/input-dto/get-posts.query-params.input-dto';
import { PostsSortBy } from '../api/input-dto/posts.sort-by';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-code';
import { AggregatedPostDto } from './dto/post.aggregated-dto';
import { LikeStatus } from '../../likes/enums/like-status';

@Injectable()
export class PostsQueryRepository {
  constructor(@InjectModel(Post.name) private PostModel: PostModelType) {}

  async getAll(
    query: GetPostsQueryParamsInputDto,
    options?: {
      blogId?: string | Types.ObjectId;
      likeAuthorId?: string | Types.ObjectId;
    },
  ): Promise<BasePaginatedViewDto<PostViewDto[]>> {
    const skip = query.skip;
    const sort = {
      [this.getSortBy(query.sortBy)]: query.sortDirection,
      _id: query.sortDirection,
    };
    const filter: QueryFilter<PostDocument> = { deletedAt: null };

    if (options?.blogId) {
      filter.blog = new Types.ObjectId(options.blogId);
    }

    const [items, totalCount] = await Promise.all([
      this.getAggregatedPosts(filter, options?.likeAuthorId)
        .sort(sort)
        .skip(skip)
        .limit(query.pageSize),
      this.PostModel.countDocuments(filter),
    ]);

    return BasePaginatedViewDto.mapToView({
      page: query.pageNumber,
      size: query.pageSize,
      totalCount,
      items: items.map((item) => PostViewDto.mapToView(item)),
    });
  }

  async findById(
    id: string | Types.ObjectId,
    likeAuthorId?: string | Types.ObjectId,
  ): Promise<PostViewDto | null> {
    const filter: QueryFilter<PostDocument> = {
      _id: new Types.ObjectId(id),
      deletedAt: null,
    };

    const [post] = await this.getAggregatedPosts(filter, likeAuthorId);

    return post ? PostViewDto.mapToView(post) : null;
  }

  async getByIdOrNotFoundFail(
    id: string | Types.ObjectId,
    likeAuthorId?: string | Types.ObjectId,
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
    return querySortBy === PostsSortBy.blogName ? 'blog.name' : querySortBy;
  }

  private getAggregatedPosts(
    filter: QueryFilter<PostDocument>,
    likeAuthorId?: string | Types.ObjectId,
  ): Aggregate<AggregatedPostDto[]> {
    return (
      this.PostModel.aggregate<AggregatedPostDto>()
        .match(filter)
        .lookup({
          from: 'blogs',
          localField: 'blog',
          foreignField: '_id',
          as: 'blog',
        })
        .unwind({
          path: '$blog',
          preserveNullAndEmptyArrays: true,
        })
        .addFields({
          blog: {
            $cond: {
              if: { $eq: ['$blog', null] },
              then: { _id: '$blog' },
              else: '$blog',
            },
          },
        }) // Получаем все лайки для комментария
        .lookup({
          from: 'likes',
          let: { commentId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ['$parent', '$$commentId'] }],
                },
              },
            },
            // Сортируем по дате создания (новые сверху)
            { $sort: { createdAt: -1 } },

            // Добавляем информацию о пользователях для newestLikes
            {
              $lookup: {
                from: 'users',
                localField: 'author',
                foreignField: '_id',
                as: 'userDetails',
              },
            },
            {
              $addFields: {
                user: { $arrayElemAt: ['$userDetails', 0] },
              },
            },
            {
              $project: {
                userDetails: 0,
              },
            },
          ],
          as: 'allLikes',
        })
        .addFields({
          // Формируем extendedLikesInfo
          extendedLikesInfo: {
            // Общее количество лайков
            likesCount: {
              $size: {
                $filter: {
                  input: '$allLikes',
                  as: 'like',
                  cond: { $eq: ['$$like.status', LikeStatus.Like] },
                },
              },
            },
            // Общее количество дизлайков
            dislikesCount: {
              $size: {
                $filter: {
                  input: '$allLikes',
                  as: 'like',
                  cond: { $eq: ['$$like.status', LikeStatus.Dislike] },
                },
              },
            },
            // Статус текущего пользователя
            myStatus: likeAuthorId
              ? {
                  $ifNull: [
                    {
                      $arrayElemAt: [
                        {
                          $map: {
                            input: {
                              $filter: {
                                input: '$allLikes',
                                as: 'like',
                                cond: {
                                  $eq: [
                                    '$$like.author',
                                    new Types.ObjectId(likeAuthorId),
                                  ],
                                },
                              },
                            },
                            as: 'like',
                            in: '$$like.status',
                          },
                        },
                        0,
                      ],
                    },
                    LikeStatus.None,
                  ],
                }
              : LikeStatus.None,

            // Последние 3 лайка с деталями
            newestLikes: {
              $map: {
                input: {
                  $slice: [
                    {
                      $filter: {
                        input: '$allLikes',
                        as: 'like',
                        cond: { $eq: ['$$like.status', LikeStatus.Like] },
                      },
                    },
                    0,
                    3,
                  ],
                },
                as: 'like',
                in: {
                  addedAt: '$$like.createdAt',
                  userId: { $toString: '$$like.author' },
                  login: '$$like.user.login', // предполагаем, что в user есть поле login
                },
              },
            },
          },
        })
        // Убираем временное поле allLikes
        .project({
          allLikes: 0,
        })
    );
  }
}
