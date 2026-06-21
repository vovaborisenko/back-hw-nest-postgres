import { SortDirection } from '../../constants/sort-direction';
import { IsEnum } from 'class-validator';
import { PaginationQueryParamsInputDto } from './pagination.query-params.input-dto';

export class BaseQueryParamsInputDto extends PaginationQueryParamsInputDto {
  @IsEnum(SortDirection)
  sortDirection: SortDirection = SortDirection.Desc;
}
