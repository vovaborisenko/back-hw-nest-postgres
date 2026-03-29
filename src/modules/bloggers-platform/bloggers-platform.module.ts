import { Module } from '@nestjs/common';
import { BlogsService } from './blogs/application/blogs.service';
import { BlogsController } from './blogs/api/blogs.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Blog, BlogSchema } from './blogs/domain/blog.entity';
import { BlogsRepository } from './blogs/infrastructure/blogs.repository';
import { BlogsQueryRepository } from './blogs/infrastructure/blogs.query-repository';
import { Post, PostSchema } from './posts/domain/post.entity';
import { PostsController } from './posts/api/posts.controller';
import { PostsService } from './posts/application/posts.service';
import { PostsQueryRepository } from './posts/infrastructure/posts.query-repository';
import { PostsRepository } from './posts/infrastructure/posts.repository';
import { CommentsRepository } from './comments/infrastructure/comments.repository';
import { Comment, CommentSchema } from './comments/domain/comment.entity';
import { CommentsQueryRepository } from './comments/infrastructure/comments.query-repository';
import { CommentsController } from './comments/api/comments.controller';
import { CommentsHandlers } from './comments/application';
import { Like, LikeSchema } from './likes/domain/like.entity';
import { SetLikeUseCase } from './likes/application/usecases/set-like.usecase';
import { LikesRepository } from './likes/infrastructure/likes.repository';
import { PostsHandlers } from './posts/application';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Blog.name, schema: BlogSchema },
      { name: Comment.name, schema: CommentSchema },
      { name: Like.name, schema: LikeSchema },
      { name: Post.name, schema: PostSchema },
    ]),
  ],
  providers: [
    BlogsService,
    BlogsRepository,
    BlogsQueryRepository,
    ...CommentsHandlers,
    CommentsRepository,
    CommentsQueryRepository,
    SetLikeUseCase,
    LikesRepository,
    PostsService,
    PostsRepository,
    PostsQueryRepository,
    ...PostsHandlers,
  ],
  controllers: [BlogsController, CommentsController, PostsController],
})
export class BloggersPlatformModule {}
