import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BasePaginatedViewDto } from '../../../../core/api/view-dto/base.paginated.view-dto';
import { BlogViewDto } from './view-dto/blog.view-dto';
import { BlogsService } from '../application/blogs.service';
import { BlogsQueryRepository } from '../infrastructure/blogs.query-repository';
import { GetBlogsQueryParamsInputDto } from './input-dto/get-blogs.query-params.input-dto';
import { CreateBlogInputDto } from './input-dto/create-blog.input-dto';
import { UpdateBlogInputDto } from './input-dto/update-blog.input-dto';
import { PostViewDto } from '../../posts/api/view-dto/post.view-dto';
import { GetPostsQueryParamsInputDto } from '../../posts/api/input-dto/get-posts.query-params.input-dto';
import { PostsService } from '../../posts/application/posts.service';
import { PostsQueryRepository } from '../../posts/infrastructure/posts.query-repository';
import { CreateBlogPostInputDto } from './input-dto/create-blog-post.input-dto';
import { PATH, PARAM } from '../../../../core/constants/paths';
import { BasicAuthGuard } from '../../../user-accounts/guards/basic/basic-auth.guard';
import { JwtOptionalAuthGuard } from '../../../user-accounts/guards/bearer/jwt-optional-auth.guard';
import { ExtractUserIfExistsFromRequestDecorator } from '../../../user-accounts/guards/decorators/param/extract-user-if-exists-from-request.decorator';
import { UserContextDto } from '../../../user-accounts/guards/dto/user-context.dto';

const { PREFIX, SINGLE, POSTS } = PATH.BLOGS;

@Controller(PREFIX)
export class BlogsController {
  constructor(
    private readonly blogService: BlogsService,
    private readonly blogsQueryRepository: BlogsQueryRepository,
    private readonly postService: PostsService,
    private readonly postsQueryRepository: PostsQueryRepository,
  ) {}

  @Get()
  getAll(
    @Query()
    query: GetBlogsQueryParamsInputDto,
  ): Promise<BasePaginatedViewDto<BlogViewDto[]>> {
    return this.blogsQueryRepository.getAll(query);
  }

  @Get(SINGLE)
  getById(@Param(PARAM.ID) id: string): Promise<BlogViewDto> {
    return this.blogsQueryRepository.getByIdOrNotFoundFail(id);
  }

  @UseGuards(BasicAuthGuard)
  @Post()
  async createBlog(@Body() dto: CreateBlogInputDto): Promise<BlogViewDto> {
    const id = await this.blogService.createBlog(dto);

    return this.blogsQueryRepository.getByIdOrNotFoundFail(id);
  }

  @UseGuards(BasicAuthGuard)
  @Put(SINGLE)
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateBlog(
    @Param(PARAM.ID) id: string,
    @Body() dto: UpdateBlogInputDto,
  ): Promise<void> {
    await this.blogService.updateBlog(id, dto);
  }

  @UseGuards(BasicAuthGuard)
  @Delete(SINGLE)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBlog(@Param(PARAM.ID) id: string): Promise<void> {
    await this.blogService.deleteBlog(id);
  }

  @UseGuards(JwtOptionalAuthGuard)
  @Get(POSTS)
  async getBlogPosts(
    @Param(PARAM.ID) blogId: string,
    @ExtractUserIfExistsFromRequestDecorator() user: UserContextDto | null,
    @Query()
    query: GetPostsQueryParamsInputDto,
  ): Promise<BasePaginatedViewDto<PostViewDto[]>> {
    await this.blogsQueryRepository.getByIdOrNotFoundFail(blogId);

    return this.postsQueryRepository.getAll(query, {
      blogId,
      likeAuthorId: user?.id,
    });
  }

  @UseGuards(BasicAuthGuard)
  @Post(POSTS)
  async createPost(
    @Param(PARAM.ID) blogId: string,
    @Body() dto: CreateBlogPostInputDto,
  ): Promise<PostViewDto> {
    const id = await this.postService.createPost({ ...dto, blogId });

    return this.postsQueryRepository.getByIdOrNotFoundFail(id);
  }
}
