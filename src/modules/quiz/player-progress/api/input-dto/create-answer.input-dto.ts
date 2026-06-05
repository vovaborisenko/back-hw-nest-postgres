import { CreateAnswerDto } from '../../dto/create-answer.dto';
import { IsStringLengthTrim } from '../../../../../core/decorators/validation/is-string-length-trim';

export class CreateAnswerInputDto implements CreateAnswerDto {
  @IsStringLengthTrim(1, 500)
  answer: string;
}
