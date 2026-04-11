import { CreateBlogUseCase } from './usecases/create-blog.usecase';
import { DeleteBlogUseCase } from './usecases/delete-blog.usecase';
import { UpdateBlogUseCase } from './usecases/update-blog.usecase';

export const BlogHandlers = [
  CreateBlogUseCase,
  DeleteBlogUseCase,
  UpdateBlogUseCase,
];
