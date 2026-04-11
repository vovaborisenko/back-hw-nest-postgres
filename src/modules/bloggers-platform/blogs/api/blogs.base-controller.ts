import { Get, Param, Query, UseGuards } from '@nestjs/common';
import { BasePaginatedViewDto } from '../../../../core/api/view-dto/base.paginated.view-dto';
import { BlogViewDto } from './view-dto/blog.view-dto';
import { BlogsQueryRepository } from '../infrastructure/blogs.query-repository';
import { GetBlogsQueryParamsInputDto } from './input-dto/get-blogs.query-params.input-dto';
import { PostViewDto } from '../../posts/api/view-dto/post.view-dto';
import { GetPostsQueryParamsInputDto } from '../../posts/api/input-dto/get-posts.query-params.input-dto';
import { PostsQueryRepository } from '../../posts/infrastructure/posts.query-repository';
import { ExtractUserIfExistsFromRequestDecorator } from '../../../user-accounts/guards/decorators/param/extract-user-if-exists-from-request.decorator';
import { UserContextDto } from '../../../user-accounts/guards/dto/user-context.dto';
import { BasePathParamsInputDto } from '../../../../core/api/input-dto/base.path-params.input-dto';
import { PATH } from '../../../../core/constants/paths';
import { JwtOptionalAuthGuard } from '../../../user-accounts/guards/bearer/jwt-optional-auth.guard';

const { POSTS } = PATH.BLOGS;

export abstract class BlogsBaseController {
  protected constructor(
    protected readonly blogsQueryRepository: BlogsQueryRepository,
    protected readonly postsQueryRepository: PostsQueryRepository,
  ) {}

  @Get()
  getAll(
    @Query()
    query: GetBlogsQueryParamsInputDto,
  ): Promise<BasePaginatedViewDto<BlogViewDto[]>> {
    return this.blogsQueryRepository.getAll(query);
  }

  @UseGuards(JwtOptionalAuthGuard)
  @Get(POSTS)
  async getBlogPosts(
    @Param() params: BasePathParamsInputDto,
    @ExtractUserIfExistsFromRequestDecorator() user: UserContextDto | null,
    @Query()
    query: GetPostsQueryParamsInputDto,
  ): Promise<BasePaginatedViewDto<PostViewDto[]>> {
    await this.blogsQueryRepository.getByIdOrNotFoundFail(params.id);

    return this.postsQueryRepository.getAll(query, {
      blogId: params.id,
      likeAuthorId: user?.id,
    });
  }
}
