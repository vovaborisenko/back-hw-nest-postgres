import { UpdateBlogDto } from '../../dto/update-blog.dto';
import { Matches } from 'class-validator';
import { IsStringLengthTrim } from '../../../../../core/decorators/validation/is-string-length-trim';
import { URL_REG_EXP } from '../../../../../core/constants/reg-exp';

export class UpdateBlogInputDto implements UpdateBlogDto {
  @IsStringLengthTrim(1, 15)
  name: string;

  @IsStringLengthTrim(1, 500)
  description: string;

  @Matches(URL_REG_EXP)
  @IsStringLengthTrim(1, 100)
  websiteUrl: string;
}
