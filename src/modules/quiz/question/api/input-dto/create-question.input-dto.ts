import { IsStringLengthTrim } from '../../../../../core/decorators/validation/is-string-length-trim';
import { IsArray, IsString } from 'class-validator';
import { CreateQuestionDto } from '../../dto/create-question.dto';

export class CreateQuestionInputDto implements CreateQuestionDto {
  @IsStringLengthTrim(10, 500)
  body: string;

  @IsArray()
  @IsString({ each: true })
  correctAnswers: string[];
}
