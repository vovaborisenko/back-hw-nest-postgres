import { SetPostLikeUseCase } from './usecases/set-post-like.usecase';
import { CreatePostUseCase } from './usecases/create-post.usecase';
import { DeletePostUseCase } from './usecases/delete-blog.usecase';
import { UpdatePostUseCase } from './usecases/update-blog.usecase';

export const PostsHandlers = [
  CreatePostUseCase,
  DeletePostUseCase,
  SetPostLikeUseCase,
  UpdatePostUseCase,
];
