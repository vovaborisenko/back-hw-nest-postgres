import { Question } from '../../domain/question.entity';
import { QuestionStatus } from '../../enums/question-status';

export class QuestionViewDto {
  id: string;
  body: string;
  correctAnswers: string[];
  published: boolean;
  createdAt: string;
  updatedAt: string;

  static mapToView(question: Question): QuestionViewDto {
    const dto = new QuestionViewDto();

    dto.id = question.id.toString();
    dto.body = question.content;
    dto.correctAnswers = question.answers;
    dto.published = question.status === QuestionStatus.Published;
    dto.createdAt = question.createdAt.toISOString();
    dto.updatedAt = question.updatedAt.toISOString();

    return dto;
  }
}
