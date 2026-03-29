import { Aggregate, QueryFilter, Types } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  Comment,
  CommentDocument,
  type CommentModelType,
} from '../domain/comment.entity';
import { CommentViewDto } from '../api/view-dto/comment.view-dto';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-code';
import { BasePaginatedViewDto } from '../../../../core/api/view-dto/base.paginated.view-dto';
import { GetCommentsQueryParamsInputDto } from '../api/input-dto/get-comments.query-params.input-dto';
import { AggregatedCommentDto } from './dto/comment.aggregated-dto';
import { LikeStatus } from '../../likes/enums/like-status';

@Injectable()
export class CommentsQueryRepository {
  constructor(
    @InjectModel(Comment.name) private readonly CommentModel: CommentModelType,
  ) {}
  async findMany(
    query: GetCommentsQueryParamsInputDto,
    postId?: string | Types.ObjectId,
    likeAuthorId?: string | Types.ObjectId,
  ): Promise<BasePaginatedViewDto<CommentViewDto[]>> {
    const skip = query.skip;
    const sort = {
      [query.sortBy]: query.sortDirection,
      _id: query.sortDirection,
    };

    const filter: QueryFilter<CommentDocument> = { deletedAt: null };

    if (postId) {
      filter.post = new Types.ObjectId(postId);
    }

    const [items, totalCount] = await Promise.all([
      this.getAggregatedComments(filter, likeAuthorId)
        .sort(sort)
        .skip(skip)
        .limit(query.pageSize),
      this.CommentModel.countDocuments(filter),
    ]);

    return BasePaginatedViewDto.mapToView({
      page: query.pageNumber,
      size: query.pageSize,
      totalCount,
      items: items.map((item) => CommentViewDto.mapToView(item)),
    });
  }

  async findById(
    id: string | Types.ObjectId,
    likeAuthorId?: string | Types.ObjectId,
  ) {
    const filter: QueryFilter<CommentDocument> = {
      _id: new Types.ObjectId(id),
      deletedAt: null,
    };

    const [comment] = await this.getAggregatedComments(filter, likeAuthorId);

    return comment ? CommentViewDto.mapToView(comment) : null;
  }

  async findByIdOrNotFoundFail(
    id: string | Types.ObjectId,
    likeAuthorId?: string | Types.ObjectId,
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

  private getAggregatedComments(
    filter: QueryFilter<CommentDocument>,
    likeAuthorId?: string | Types.ObjectId,
  ): Aggregate<AggregatedCommentDto[]> {
    return (
      this.CommentModel.aggregate<AggregatedCommentDto>()
        .match(filter)
        .lookup({
          from: 'users',
          localField: 'author',
          foreignField: '_id',
          as: 'author',
        })
        .unwind({
          path: '$author',
          preserveNullAndEmptyArrays: true,
        })
        .addFields({
          author: {
            $cond: {
              if: { $eq: ['$author', null] },
              then: { _id: '$author' },
              else: '$author',
            },
          },
        })
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
            {
              $group: {
                _id: null,
                likesCount: {
                  $sum: {
                    $cond: [{ $eq: ['$status', LikeStatus.Like] }, 1, 0],
                  },
                },
                dislikesCount: {
                  $sum: {
                    $cond: [{ $eq: ['$status', LikeStatus.Dislike] }, 1, 0],
                  },
                },
                // Если нужно добавить статус лайка текущего пользователя
                ...(likeAuthorId && {
                  userLikeStatus: {
                    $max: {
                      $cond: [
                        { $eq: ['$author', new Types.ObjectId(likeAuthorId)] },
                        '$status',
                        null,
                      ],
                    },
                  },
                }),
              },
            },
          ],
          as: 'likeStats',
        })
        .addFields({
          // Извлекаем статистику из массива (там будет 0 или 1 элемент)
          likesCount: {
            $ifNull: [{ $arrayElemAt: ['$likeStats.likesCount', 0] }, 0],
          },
          dislikesCount: {
            $ifNull: [{ $arrayElemAt: ['$likeStats.dislikesCount', 0] }, 0],
          },
          ...(likeAuthorId && {
            userLikeStatus: {
              $ifNull: [
                { $arrayElemAt: ['$likeStats.userLikeStatus', 0] },
                null,
              ],
            },
          }),
        })
        // Убираем временное поле likeStats
        .project({
          likeStats: 0,
        })
    );
  }
}
