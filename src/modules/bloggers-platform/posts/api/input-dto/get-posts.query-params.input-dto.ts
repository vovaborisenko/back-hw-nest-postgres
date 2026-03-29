import { BaseQueryParamsInputDto } from '../../../../../core/api/input-dto/base.query-params.input-dto';
import { PostsSortBy } from './posts.sort-by';
import { IsEnum } from 'class-validator';

export class GetPostsQueryParamsInputDto extends BaseQueryParamsInputDto {
  @IsEnum(PostsSortBy)
  sortBy: PostsSortBy = PostsSortBy.CreatedAt;
}
