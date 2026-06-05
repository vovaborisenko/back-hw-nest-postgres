import { BaseDbEntity } from '../../../../core/domain/baseDbEntity';
import { Column, Entity, OneToMany } from 'typeorm';
import { QuestionStatus } from '../enums/question-status';
import { CreateQuestionDomainDto } from './dto/create-question.domain-dto';
import { GameToQuestion } from '../../game/domain/question-to-game.entity';
import { Answer } from '../../player-progress/domain/answer.entity';

@Entity()
export class Question extends BaseDbEntity {
  @Column()
  content: string;

  @Column({ type: 'jsonb' })
  keys: string[];

  @Column({ type: 'enum', enum: QuestionStatus, default: QuestionStatus.Draft })
  status: QuestionStatus;

  @OneToMany(() => GameToQuestion, (questionToGame) => questionToGame.question)
  gameToQuestions: GameToQuestion[];

  @OneToMany(() => Answer, (answer) => answer.question)
  answers: Answer[];

  static create(dto: CreateQuestionDomainDto): Question {
    const question = new this();

    question.content = dto.body;
    question.keys = dto.correctAnswers;

    return question;
  }
}
