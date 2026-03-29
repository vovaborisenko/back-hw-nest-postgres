import { UpdateCommentDto } from '../../dto/update-comment.dto';
import { IsStringLengthTrim } from '../../../../../core/decorators/validation/is-string-length-trim';

export class UpdateCommentInputDto implements UpdateCommentDto {
  @IsStringLengthTrim(20, 300)
  content: string;
}
