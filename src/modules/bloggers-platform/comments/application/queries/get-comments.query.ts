import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { CommentViewDto } from '../../api/view-dto/comment.view-dto';
import { CommentsQueryRepository } from '../../infrastructure/comments.query-repository';
import { GetCommentsQueryParamsInputDto } from '../../api/input-dto/get-comments.query-params.input-dto';
import { BasePaginatedViewDto } from '../../../../../core/api/view-dto/base.paginated.view-dto';
import { PostsRepository } from '../../../posts/infrastructure/posts.repository';

export class GetCommentsQuery extends Query<
  BasePaginatedViewDto<CommentViewDto[]>
> {
  constructor(
    public readonly query: GetCommentsQueryParamsInputDto,
    public readonly postId?: number,
    public readonly likeAuthorId?: number,
  ) {
    super();
  }
}

@QueryHandler(GetCommentsQuery)
export class GetCommentsQueryHandler implements IQueryHandler<GetCommentsQuery> {
  constructor(
    private readonly commentsQueryRepository: CommentsQueryRepository,
    private readonly postsRepository: PostsRepository,
  ) {}

  async execute({
    query,
    postId,
    likeAuthorId,
  }: GetCommentsQuery): Promise<BasePaginatedViewDto<CommentViewDto[]>> {
    if (postId) {
      await this.postsRepository.findByIdOrNotFound(postId);
    }

    return this.commentsQueryRepository.findMany(query, postId, likeAuthorId);
  }
}
