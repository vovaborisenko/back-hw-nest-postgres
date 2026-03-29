import { CreateBlogPostDto } from '../../dto/create-blog-post.dto';
import { IsStringLengthTrim } from '../../../../../core/decorators/validation/is-string-length-trim';

export class CreateBlogPostInputDto implements CreateBlogPostDto {
  @IsStringLengthTrim(1, 30)
  title: string;

  @IsStringLengthTrim(1, 100)
  shortDescription: string;

  @IsStringLengthTrim(1, 1000)
  content: string;
}
