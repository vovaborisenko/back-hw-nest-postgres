import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { BlogViewDto } from './view-dto/blog.view-dto';
import { BlogsQueryRepository } from '../infrastructure/blogs.query-repository';
import { CreateBlogInputDto } from './input-dto/create-blog.input-dto';
import { UpdateBlogInputDto } from './input-dto/update-blog.input-dto';
import { PostViewDto } from '../../posts/api/view-dto/post.view-dto';
import { PostsQueryRepository } from '../../posts/infrastructure/posts.query-repository';
import { CreateBlogPostInputDto } from './input-dto/create-blog-post.input-dto';
import { CommandBus } from '@nestjs/cqrs';
import { CreateBlogCommand } from '../application/usecases/create-blog.usecase';
import { BasePathParamsInputDto } from '../../../../core/api/input-dto/base.path-params.input-dto';
import { UpdateBlogCommand } from '../application/usecases/update-blog.usecase';
import { DeleteBlogCommand } from '../application/usecases/delete-blog.usecase';
import { CreatePostCommand } from '../../posts/application/usecases/create-post.usecase';
import { UpdatePostCommand } from '../../posts/application/usecases/update-blog.usecase';
import { BlogPostPathParamsInputDto } from './input-dto/blog-post.path-params.input-dto';
import { DeletePostCommand } from '../../posts/application/usecases/delete-blog.usecase';
import { PATH } from '../../../../core/constants/paths';
import { BlogsBaseController } from './blogs.base-controller';
import { BasicAuthGuard } from '../../../user-accounts/guards/basic/basic-auth.guard';

const { SA_PREFIX, SINGLE, POSTS, POST } = PATH.BLOGS;

@UseGuards(BasicAuthGuard)
@Controller(SA_PREFIX)
export class BlogsSaController extends BlogsBaseController {
  constructor(
    protected readonly blogsQueryRepository: BlogsQueryRepository,
    protected readonly postsQueryRepository: PostsQueryRepository,
    protected readonly commandBus: CommandBus,
  ) {
    super(blogsQueryRepository, postsQueryRepository);
  }

  @Post()
  async createBlog(@Body() dto: CreateBlogInputDto): Promise<BlogViewDto> {
    const id = await this.commandBus.execute(new CreateBlogCommand(dto));

    return this.blogsQueryRepository.getByIdOrNotFoundFail(id);
  }

  @Put(SINGLE)
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateBlog(
    @Param() params: BasePathParamsInputDto,
    @Body() dto: UpdateBlogInputDto,
  ): Promise<void> {
    await this.commandBus.execute(new UpdateBlogCommand(params.id, dto));
  }

  @Delete(SINGLE)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBlog(@Param() params: BasePathParamsInputDto): Promise<void> {
    await this.commandBus.execute(new DeleteBlogCommand(params.id));
  }

  @Post(POSTS)
  async createPost(
    @Param() params: BasePathParamsInputDto,
    @Body() dto: CreateBlogPostInputDto,
  ): Promise<PostViewDto> {
    await this.blogsQueryRepository.getByIdOrNotFoundFail(params.id);

    const id = await this.commandBus.execute(
      new CreatePostCommand({ ...dto, blogId: params.id }),
    );

    return this.postsQueryRepository.getByIdOrNotFoundFail(id);
  }

  @Put(POST)
  @HttpCode(HttpStatus.NO_CONTENT)
  async updatePost(
    @Param() params: BlogPostPathParamsInputDto,
    @Body() dto: CreateBlogPostInputDto,
  ): Promise<void> {
    await this.blogsQueryRepository.getByIdOrNotFoundFail(params.id);

    await this.commandBus.execute(
      new UpdatePostCommand(params.postId, { ...dto, blogId: params.id }),
    );
  }

  @Delete(POST)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePost(@Param() params: BlogPostPathParamsInputDto): Promise<void> {
    await this.blogsQueryRepository.getByIdOrNotFoundFail(params.id);

    await this.commandBus.execute(new DeletePostCommand(params.postId));
  }
}
