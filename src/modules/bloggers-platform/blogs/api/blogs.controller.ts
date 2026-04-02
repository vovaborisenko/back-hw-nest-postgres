import { Controller, Get, Param } from '@nestjs/common';
import { BlogViewDto } from './view-dto/blog.view-dto';
import { BlogsQueryRepository } from '../infrastructure/blogs.query-repository';
import { PostsQueryRepository } from '../../posts/infrastructure/posts.query-repository';
import { BasePathParamsInputDto } from '../../../../core/api/input-dto/base.path-params.input-dto';
import { PATH } from '../../../../core/constants/paths';
import { BlogsBaseController } from './blogs.base-controller';

const { PREFIX, SINGLE } = PATH.BLOGS;

@Controller(PREFIX)
export class BlogsController extends BlogsBaseController {
  constructor(
    protected readonly blogsQueryRepository: BlogsQueryRepository,
    protected readonly postsQueryRepository: PostsQueryRepository,
  ) {
    super(blogsQueryRepository, postsQueryRepository);
  }

  @Get(SINGLE)
  getById(@Param() params: BasePathParamsInputDto): Promise<BlogViewDto> {
    return this.blogsQueryRepository.getByIdOrNotFoundFail(params.id);
  }
}
