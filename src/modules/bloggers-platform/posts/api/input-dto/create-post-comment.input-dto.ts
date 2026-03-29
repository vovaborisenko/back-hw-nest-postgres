import { CreatePostCommentDto } from '../../dto/create-post-comment.dto';
import { IsStringLengthTrim } from '../../../../../core/decorators/validation/is-string-length-trim';

export class CreatePostCommentInputDto implements CreatePostCommentDto {
  @IsStringLengthTrim(20, 300)
  content: string;
}
