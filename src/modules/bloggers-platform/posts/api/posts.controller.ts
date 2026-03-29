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
import { PostViewDto } from './view-dto/post.view-dto';
import { PostsService } from '../application/posts.service';
import { PostsQueryRepository } from '../infrastructure/posts.query-repository';
import { GetPostsQueryParamsInputDto } from './input-dto/get-posts.query-params.input-dto';
import { CreatePostInputDto } from './input-dto/create-post.input-dto';
import { UpdatePostInputDto } from './input-dto/update-post.input-dto';
import { PATH, PARAM } from '../../../../core/constants/paths';
import { BasicAuthGuard } from '../../../user-accounts/guards/basic/basic-auth.guard';
import { JwtAuthGuard } from '../../../user-accounts/guards/bearer/jwt-auth.guard';
import { ExtractUserFromRequestDecorator } from '../../../user-accounts/guards/decorators/param/extract-user-from-request.decorator';
import { UserContextDto } from '../../../user-accounts/guards/dto/user-context.dto';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateCommentCommand } from '../../comments/application/usecases/create-comment.usecase';
import { CreatePostCommentInputDto } from './input-dto/create-post-comment.input-dto';
import { GetCommentByIdQuery } from '../../comments/application/queries/get-comment-by-id.query';
import { CommentViewDto } from '../../comments/api/view-dto/comment.view-dto';
import { GetCommentsQueryParamsInputDto } from '../../comments/api/input-dto/get-comments.query-params.input-dto';
import { GetCommentsQuery } from '../../comments/application/queries/get-comments.query';
import { LikeInputDto } from '../../likes/api/input-dto/like.input-dto';
import { JwtOptionalAuthGuard } from '../../../user-accounts/guards/bearer/jwt-optional-auth.guard';
import { ExtractUserIfExistsFromRequestDecorator } from '../../../user-accounts/guards/decorators/param/extract-user-if-exists-from-request.decorator';
import { SetPostLikeCommand } from '../application/usecases/set-post-like.usecase';

const { PREFIX, SINGLE, COMMENTS, LIKE_STATUS } = PATH.POSTS;

@Controller(PREFIX)
export class PostsController {
  constructor(
    private readonly postService: PostsService,
    private readonly postsQueryRepository: PostsQueryRepository,
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @UseGuards(JwtOptionalAuthGuard)
  @Get()
  getAll(
    @ExtractUserIfExistsFromRequestDecorator() user: UserContextDto | null,
    @Query()
    query: GetPostsQueryParamsInputDto,
  ): Promise<BasePaginatedViewDto<PostViewDto[]>> {
    return this.postsQueryRepository.getAll(query, { likeAuthorId: user?.id });
  }

  @UseGuards(JwtOptionalAuthGuard)
  @Get(SINGLE)
  getById(
    @Param(PARAM.ID) id: string,
    @ExtractUserIfExistsFromRequestDecorator() user: UserContextDto | null,
  ): Promise<PostViewDto> {
    return this.postsQueryRepository.getByIdOrNotFoundFail(id, user?.id);
  }

  @UseGuards(BasicAuthGuard)
  @Post()
  async createPost(@Body() dto: CreatePostInputDto): Promise<PostViewDto> {
    const id = await this.postService.createPost(dto);

    return this.postsQueryRepository.getByIdOrNotFoundFail(id);
  }

  @UseGuards(BasicAuthGuard)
  @Put(SINGLE)
  @HttpCode(HttpStatus.NO_CONTENT)
  async updatePost(
    @Param(PARAM.ID) id: string,
    @Body() dto: UpdatePostInputDto,
  ): Promise<void> {
    await this.postService.updatePost(id, dto);
  }

  @UseGuards(BasicAuthGuard)
  @Delete(SINGLE)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePost(@Param(PARAM.ID) id: string): Promise<void> {
    await this.postService.deletePost(id);
  }

  @UseGuards(JwtOptionalAuthGuard)
  @Get(COMMENTS)
  async getPostComments(
    @Param(PARAM.ID) postId: string,
    @ExtractUserIfExistsFromRequestDecorator() user: UserContextDto | null,
    @Query()
    query: GetCommentsQueryParamsInputDto,
  ): Promise<BasePaginatedViewDto<CommentViewDto[]>> {
    return this.queryBus.execute(new GetCommentsQuery(query, postId, user?.id));
  }

  @UseGuards(JwtAuthGuard)
  @Post(COMMENTS)
  async createPostComment(
    @Param(PARAM.ID) postId: string,
    @Body() dto: CreatePostCommentInputDto,
    @ExtractUserFromRequestDecorator() user: UserContextDto,
  ): Promise<CommentViewDto> {
    const { commentId } = await this.commandBus.execute(
      new CreateCommentCommand({
        content: dto.content,
        post: postId,
        author: user.id,
      }),
    );

    return this.queryBus.execute(new GetCommentByIdQuery(commentId));
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Put(LIKE_STATUS)
  async updateLikeStatus(
    @ExtractUserFromRequestDecorator() user: UserContextDto,
    @Param(PARAM.ID) postId: string,
    @Body() dto: LikeInputDto,
  ): Promise<void> {
    await this.commandBus.execute(
      new SetPostLikeCommand({
        status: dto.likeStatus,
        author: user.id,
        parent: postId,
      }),
    );
  }
}
