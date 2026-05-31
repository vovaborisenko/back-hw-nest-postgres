import { IsStringLengthTrim } from '../../../../../core/decorators/validation/is-string-length-trim';
import { IsArray, IsString } from 'class-validator';

export class CreateQuestionInputDto implements CreateQuestionInputDto {
  @IsStringLengthTrim(10, 500)
  body: string;

  @IsArray()
  @IsString({ each: true })
  correctAnswers: string[];
}
