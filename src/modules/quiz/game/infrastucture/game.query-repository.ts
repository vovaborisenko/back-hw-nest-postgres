import { Game } from '../domain/game.entity';
import { In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { GameStatus } from '../enum/game-status';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-code';
import { GameViewDto } from '../api/view-dto/game.view-dto';
import { PlayerProgress } from '../../player-progress/domain/player-progress.entity';

@Injectable()
export class GameQueryRepository {
  constructor(
    @InjectRepository(Game) private readonly gameRepo: Repository<Game>,
    @InjectRepository(PlayerProgress)
    private readonly playerProgressRepo: Repository<PlayerProgress>,
  ) {}

  async findCurrent(playerId: number): Promise<GameViewDto | null> {
    const gamePlayer = await this.playerProgressRepo.findOne({
      where: {
        game: { status: In([GameStatus.Pending, GameStatus.Active]) },
        user: { id: playerId },
      },
      relations: {
        game: true,
      },
    });

    if (!gamePlayer) {
      return null;
    }

    return this.findById(gamePlayer.game.id);
  }

  async findCurrentOrNotFoundFail(playerId: number): Promise<GameViewDto> {
    const game = await this.findCurrent(playerId);

    if (!game) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Player does not have active game',
      });
    }

    return game;
  }

  async findById(id: number): Promise<GameViewDto | null> {
    const game = await this.gameRepo.findOne({
      where: { id },
      relations: {
        playerProgresses: { user: true, answers: true },
        gameToQuestions: { question: true },
      },
    });

    return game ? GameViewDto.mapToView(game) : null;
  }

  async findByIdOrNotFoundFail(id: number): Promise<GameViewDto> {
    const game = await this.findById(id);

    if (!game) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Game not found',
      });
    }

    return game;
  }

  async findByIdOrThrow(id: number, playerId: number): Promise<GameViewDto> {
    const game = await this.findById(id);

    if (!game) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Game not found',
      });
    }

    if (
      ![
        game.firstPlayerProgress?.player.id,
        game.secondPlayerProgress?.player.id,
      ].includes(playerId.toString())
    ) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'Game forbidden',
      });
    }

    return game;
  }
}
