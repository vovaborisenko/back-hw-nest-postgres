import { AnswerStatus } from '../../enum/answer-status';

export interface CreateAnswerDomainDto {
  playerProgressId: number;
  questionId: number;
  text: string;
  status: AnswerStatus;
}
