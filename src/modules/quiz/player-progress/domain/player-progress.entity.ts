import { BaseDbEntity } from '../../../../core/domain/baseDbEntity';
import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { User } from '../../../user-accounts/domain/user.entity';
import { Answer } from './answer.entity';
import { Game } from '../../game/domain/game.entity';
import { CreatePlayerProgressDomainDto } from './dto/create-player-progress.domain-dto';
import { GameResult } from '../enum/game-result';

@Entity()
export class PlayerProgress extends BaseDbEntity {
  @ManyToOne(() => User, (user) => user.playerProgresses)
  user: User;

  @Column()
  userId: number;

  @ManyToOne(() => Game, (game) => game.playerProgresses, { nullable: false })
  game: Game;

  @Column()
  gameId: number;

  @OneToMany(() => Answer, (answer) => answer.playerProgress)
  answers: Answer[];

  @Column({ default: 0 })
  score: number;

  @Column({ type: 'enum', enum: GameResult, nullable: true })
  gameResult: GameResult | null = null;

  static create(dto: CreatePlayerProgressDomainDto): PlayerProgress {
    const player = new PlayerProgress();

    player.userId = dto.userId;
    player.gameId = dto.gameId;

    return player;
  }
}
