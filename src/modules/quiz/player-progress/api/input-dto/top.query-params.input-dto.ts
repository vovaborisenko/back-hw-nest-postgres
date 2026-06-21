import { IsArray, IsString } from 'class-validator';
import { PaginationQueryParamsInputDto } from '../../../../../core/api/input-dto/pagination.query-params.input-dto';
import { Transform } from 'class-transformer';

export class TopQueryParamsInputDto extends PaginationQueryParamsInputDto {
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }): string[] => {
    if (!value) return ['avgScores desc', 'sumScore desc'];
    if (typeof value === 'string') return [value];

    return Array.isArray(value) ? value : [];
  })
  sort: string[] = ['avgScores desc', 'sumScore desc'];
}
