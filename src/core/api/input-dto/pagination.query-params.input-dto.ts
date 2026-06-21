import { Type } from 'class-transformer';
import { IsNumber } from 'class-validator';

export class PaginationQueryParamsInputDto {
  @Type(() => Number)
  @IsNumber()
  pageNumber: number = 1;

  @Type(() => Number)
  @IsNumber()
  pageSize: number = 10;

  get skip(): number {
    return (this.pageNumber - 1) * this.pageSize;
  }
}
