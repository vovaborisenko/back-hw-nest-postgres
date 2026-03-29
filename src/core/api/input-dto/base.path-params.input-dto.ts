import { IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class BasePathParamsInputDto {
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  id: number;
}
