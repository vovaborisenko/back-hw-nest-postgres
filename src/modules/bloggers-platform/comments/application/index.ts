import { GetCommentByIdQueryHandler } from './queries/get-comment-by-id.query';
import { GetCommentsQueryHandler } from './queries/get-comments.query';
import { CreateCommentUseCase } from './usecases/create-comment.usecase';
import { DeleteCommentUseCase } from './usecases/delete-comment.usecase';
import { UpdateCommentUseCase } from './usecases/update-comment.usecase';
import { SetCommentLikeUseCase } from './usecases/set-comment-like.usecase';

export const CommentsHandlers = [
  GetCommentByIdQueryHandler,
  GetCommentsQueryHandler,
  //
  CreateCommentUseCase,
  DeleteCommentUseCase,
  UpdateCommentUseCase,
  //
  SetCommentLikeUseCase,
];
