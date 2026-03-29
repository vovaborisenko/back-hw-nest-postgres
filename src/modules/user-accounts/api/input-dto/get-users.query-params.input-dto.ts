import { BaseQueryParamsInputDto } from '../../../../core/api/input-dto/base.query-params.input-dto';
import { UsersSortBy } from './users.sort-by';
import { IsEnum, IsOptional } from 'class-validator';
import { IsStringLengthTrim } from '../../../../core/decorators/validation/is-string-length-trim';

export class GetUsersQueryParamsInputDto extends BaseQueryParamsInputDto {
  @IsEnum(UsersSortBy)
  sortBy: UsersSortBy = UsersSortBy.CreatedAt;

  @IsStringLengthTrim()
  @IsOptional()
  searchLoginTerm: string | null = null;

  @IsStringLengthTrim()
  @IsOptional()
  searchEmailTerm: string | null = null;
}
