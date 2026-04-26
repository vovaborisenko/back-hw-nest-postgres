import { IsInt, IsPositive } from 'class-validator';
import { UpdatePostDto } from '../../dto/update-post.dto';
import { IsStringLengthTrim } from '../../../../../core/decorators/validation/is-string-length-trim';
import { Type } from 'class-transformer';

export class UpdatePostInputDto implements UpdatePostDto {
  @IsStringLengthTrim(1, 30)
  title: string;

  @IsStringLengthTrim(1, 100)
  shortDescription: string;

  @IsStringLengthTrim(1, 1000)
  content: string;

  @Type(() => Number)
  @IsInt()
  @IsPositive()
  blogId: number;
}
