import { BaseDbEntity } from '../../../../core/domain/baseDbEntity';
import { Game } from './game.entity';
import { Column, Entity, ManyToOne } from 'typeorm';
import { Question } from '../../question/domain/question.entity';

@Entity()
export class GameToQuestion extends BaseDbEntity {
  @ManyToOne(() => Game, (game) => game.gameToQuestions)
  game: Game;

  @Column()
  gameId: number;

  @ManyToOne(() => Question, (question) => question.gameToQuestions)
  question: Question;

  @Column()
  questionId: number;

  static create(questionId: number, gameId: number): GameToQuestion {
    const question = new GameToQuestion();

    question.questionId = questionId;
    question.gameId = gameId;

    return question;
  }
}
