import { Answer } from '../../domain/answer.entity';
import { AnswerStatus } from '../../enum/answer-status';

export class AnswerViewDto {
  questionId: string;
  answerStatus: AnswerStatus;
  addedAt: string;

  static mapToView(dto: Answer): AnswerViewDto {
    const view = new AnswerViewDto();

    view.questionId = dto.questionId.toString();
    view.answerStatus = dto.status;
    view.addedAt = dto.createdAt.toISOString();

    return view;
  }
}
