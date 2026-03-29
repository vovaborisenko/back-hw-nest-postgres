import { BaseQueryParamsInputDto } from '../../../../../core/api/input-dto/base.query-params.input-dto';
import { BlogsSortBy } from './blogs.sort-by';
import { IsEnum, IsOptional } from 'class-validator';
import { IsStringLengthTrim } from '../../../../../core/decorators/validation/is-string-length-trim';

export class GetBlogsQueryParamsInputDto extends BaseQueryParamsInputDto {
  @IsEnum(BlogsSortBy)
  sortBy: BlogsSortBy = BlogsSortBy.CreatedAt;

  @IsStringLengthTrim()
  @IsOptional()
  searchNameTerm: string | null = null;
}
