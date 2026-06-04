import { BaseDbEntity } from '../../../../core/domain/baseDbEntity';
import { Column, Entity, ManyToOne } from 'typeorm';
import { AnswerStatus } from '../enum/answer-status';
import { PlayerProgress } from './player-progress.entity';
import { Question } from '../../question/domain/question.entity';
import { CreateAnswerDomainDto } from './dto/create-answer.domain-dto';

@Entity()
export class Answer extends BaseDbEntity {
  @ManyToOne(() => PlayerProgress, (playerProgress) => playerProgress.answers, {
    nullable: false,
  })
  playerProgress: PlayerProgress;

  @Column()
  playerProgressId: number;

  @ManyToOne(() => Question, (question) => question.answers, {
    nullable: false,
  })
  question: Question;

  @Column()
  questionId: number;

  @Column()
  text: string;

  @Column({ type: 'enum', enum: AnswerStatus })
  status: AnswerStatus;

  static create(dto: CreateAnswerDomainDto): Answer {
    const answer = new Answer();

    answer.playerProgressId = dto.playerProgressId;
    answer.questionId = dto.questionId;
    answer.text = dto.text;
    answer.status = dto.status;

    return answer;
  }
}
