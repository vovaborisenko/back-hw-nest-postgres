import { BaseDbEntity } from '../../../../core/domain/baseDbEntity';
import { Column, Entity } from 'typeorm';
import { QuestionStatus } from '../enums/question-status';
import { CreateQuestionDomainDto } from './dto/create-question.domain-dto';

@Entity()
export class Question extends BaseDbEntity {
  @Column()
  content: string;

  @Column({ type: 'jsonb' })
  answers: string[];

  @Column({ type: 'enum', enum: QuestionStatus, default: QuestionStatus.Draft })
  status: QuestionStatus;

  static create(dto: CreateQuestionDomainDto): Question {
    const question = new this();

    question.content = dto.body;
    question.answers = dto.correctAnswers;

    return question;
  }
}
