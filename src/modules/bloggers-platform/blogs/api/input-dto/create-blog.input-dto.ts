import { CreateBlogDto } from '../../dto/create-blog.dto';
import { IsStringLengthTrim } from '../../../../../core/decorators/validation/is-string-length-trim';
import { Matches } from 'class-validator';
import { URL_REG_EXP } from '../../../../../core/constants/reg-exp';

export class CreateBlogInputDto implements CreateBlogDto {
  @IsStringLengthTrim(1, 15)
  name: string;

  @IsStringLengthTrim(1, 500)
  description: string;

  @Matches(URL_REG_EXP)
  @IsStringLengthTrim(1, 100)
  websiteUrl: string;
}
