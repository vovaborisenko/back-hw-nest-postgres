import { UpdateQuestionStatusDto } from '../../dto/update-question-status.dto';
import { IsBoolean } from 'class-validator';

export class UpdateQuestionStatusInputDto implements UpdateQuestionStatusDto {
  @IsBoolean()
  published: boolean;
}
