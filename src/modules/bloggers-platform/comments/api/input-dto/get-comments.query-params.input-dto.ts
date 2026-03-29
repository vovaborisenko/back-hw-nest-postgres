import { BaseQueryParamsInputDto } from '../../../../../core/api/input-dto/base.query-params.input-dto';
import { IsEnum } from 'class-validator';
import { CommentsSortBy } from './comments.sort-by';

export class GetCommentsQueryParamsInputDto extends BaseQueryParamsInputDto {
  @IsEnum(CommentsSortBy)
  sortBy: CommentsSortBy = CommentsSortBy.CreatedAt;
}
