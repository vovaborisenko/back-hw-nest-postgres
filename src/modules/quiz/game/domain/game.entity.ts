import { BaseDbEntity } from '../../../../core/domain/baseDbEntity';
import { Column, Entity, OneToMany } from 'typeorm';
import { GameStatus } from '../enum/game-status';
import { GameToQuestion } from './question-to-game.entity';
import { PlayerProgress } from '../../player-progress/domain/player-progress.entity';

@Entity()
export class Game extends BaseDbEntity {
  @OneToMany(() => PlayerProgress, (player) => player.game)
  playerProgresses: PlayerProgress[];

  @OneToMany(() => GameToQuestion, (questionToGame) => questionToGame.game)
  gameToQuestions: GameToQuestion[];

  @Column({ type: 'enum', enum: GameStatus, default: GameStatus.Pending })
  status: GameStatus;

  @Column({ type: 'timestamptz', nullable: true })
  startedAt: Date | null = null;

  @Column({ type: 'timestamptz', nullable: true })
  finishedAt: Date | null = null;

  static create(): Game {
    const game = new Game();

    game.status = GameStatus.Pending;

    return game;
  }
}
