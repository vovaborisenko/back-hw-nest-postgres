import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { CommentViewDto } from '../../api/view-dto/comment.view-dto';
import { CommentsQueryRepository } from '../../infrastructure/comments.query-repository';

export class GetCommentByIdQuery extends Query<CommentViewDto> {
  constructor(
    public readonly id: number,
    public readonly likeAuthorId?: number,
  ) {
    super();
  }
}

@QueryHandler(GetCommentByIdQuery)
export class GetCommentByIdQueryHandler implements IQueryHandler<GetCommentByIdQuery> {
  constructor(
    private readonly commentsQueryRepository: CommentsQueryRepository,
  ) {}

  execute({ id, likeAuthorId }: GetCommentByIdQuery): Promise<CommentViewDto> {
    return this.commentsQueryRepository.findByIdOrNotFoundFail(
      id,
      likeAuthorId,
    );
  }
}
