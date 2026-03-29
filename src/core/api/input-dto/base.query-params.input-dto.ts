import { Type } from 'class-transformer';
import { SortDirection } from '../../constants/sort-direction';
import { IsEnum, IsNumber } from 'class-validator';

export class BaseQueryParamsInputDto {
  @Type(() => Number)
  @IsNumber()
  pageNumber: number = 1;

  @Type(() => Number)
  @IsNumber()
  pageSize: number = 10;

  @IsEnum(SortDirection)
  sortDirection: SortDirection = SortDirection.Desc;

  get skip(): number {
    return (this.pageNumber - 1) * this.pageSize;
  }
}
