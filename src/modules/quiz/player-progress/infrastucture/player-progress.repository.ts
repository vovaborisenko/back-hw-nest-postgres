import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlayerProgress } from '../domain/player-progress.entity';
import { GameStatus } from '../../game/enum/game-status';

@Injectable()
export class PlayerProgressRepository {
  constructor(
    @InjectRepository(PlayerProgress)
    protected readonly playerProgressRepo: Repository<PlayerProgress>,
  ) {}

  async findActive(userId: number): Promise<PlayerProgress | null> {
    return this.playerProgressRepo.findOne({
      where: {
        userId,
        game: { status: GameStatus.Active },
      },
      relations: {
        game: { gameToQuestions: { question: true } },
        answers: true,
      },
    });
  }
}
