import { IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { BasePathParamsInputDto } from '../../../../../core/api/input-dto/base.path-params.input-dto';

export class BlogPostPathParamsInputDto extends BasePathParamsInputDto {
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  postId: number;
}
