import { Game } from '../domain/game.entity';
import { In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { GameStatus } from '../enum/game-status';
import { GameToQuestion } from '../domain/question-to-game.entity';
import { PlayerProgress } from '../../player-progress/domain/player-progress.entity';

@Injectable()
export class GameRepository {
  constructor(
    @InjectRepository(Game) private readonly gameRepo: Repository<Game>,
    @InjectRepository(PlayerProgress)
    private readonly playerProgressRepo: Repository<PlayerProgress>,
  ) {}

  async findById(id: number): Promise<Game | null> {
    return this.gameRepo.findOne({
      where: { id },
      relations: {
        gameToQuestions: { question: true },
        playerProgresses: { answers: true },
      },
    });
  }

  async findPending(): Promise<Game | null> {
    return this.gameRepo.findOne({
      where: { status: GameStatus.Pending },
    });
  }

  async checkActiveGameForUser(userId: number): Promise<boolean> {
    const count = await this.playerProgressRepo.count({
      where: {
        userId,
        game: { status: In([GameStatus.Active, GameStatus.Pending]) },
      },
      relations: { game: true },
    });

    return count > 0;
  }

  create(): Game {
    return Game.create();
  }

  createPlayerProgress(gameId: number, userId: number): PlayerProgress {
    return PlayerProgress.create({
      userId,
      gameId,
    });
  }

  createQuestions(gameId: number, questionIds: number[]): GameToQuestion[] {
    return questionIds.map((id) => GameToQuestion.create(id, gameId));
  }

  save(game: Game) {
    return this.gameRepo.save(game);
  }
}
