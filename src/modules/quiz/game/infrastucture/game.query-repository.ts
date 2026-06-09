import { Game } from '../domain/game.entity';
import { In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { GameStatus } from '../enum/game-status';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-code';
import { GameViewDto } from '../api/view-dto/game.view-dto';
import { PlayerProgress } from '../../player-progress/domain/player-progress.entity';
import { BasePaginatedViewDto } from '../../../../core/api/view-dto/base.paginated.view-dto';
import { GamesSortBy } from '../api/input-dto/games.sort-by';
import { GetGamesQueryParamsInputDto } from '../api/input-dto/get-games.query-params.input-dto';
import { SortDirection } from '../../../../core/constants/sort-direction';

@Injectable()
export class GameQueryRepository {
  constructor(
    @InjectRepository(Game) private readonly gameRepo: Repository<Game>,
    @InjectRepository(PlayerProgress)
    private readonly playerProgressRepo: Repository<PlayerProgress>,
  ) {}

  private getSortBy(sortBy: GamesSortBy): string {
    return (
      {
        [GamesSortBy.CreatedAt]: 'createdAt',
        [GamesSortBy.FinishedAt]: 'finishedAt',
        [GamesSortBy.StartedAt]: 'startedAt',
        [GamesSortBy.Status]: 'status',
      }[sortBy] || sortBy
    );
  }

  private getSortDirection(direction: SortDirection) {
    return direction === SortDirection.Asc ? 'ASC' : 'DESC';
  }

  async findGames(
    query: GetGamesQueryParamsInputDto,
    userId: number,
  ): Promise<BasePaginatedViewDto<GameViewDto[]>> {
    const sortBy = this.getSortBy(query.sortBy);
    const sortDirection = this.getSortDirection(query.sortDirection);
    const gameIdQb = this.gameRepo
      .createQueryBuilder('game')
      .innerJoin(
        'game.playerProgresses',
        'progress',
        'progress.userId = :userId',
        { userId },
      )
      .select('game.id')
      .orderBy(`game.${sortBy}`, sortDirection);

    if (query.sortBy !== GamesSortBy.CreatedAt) {
      gameIdQb.addOrderBy('game.createdAt', 'DESC');
    }

    gameIdQb.addOrderBy('game.id', sortDirection);

    const totalCount = await gameIdQb.getCount();

    const rawIds = await gameIdQb
      .offset(query.skip)
      .limit(query.pageSize)
      .getRawMany<{ game_id: number }>();

    const gameIds = rawIds.map(({ game_id }) => game_id);

    if (gameIds.length === 0) {
      return BasePaginatedViewDto.mapToView({
        page: query.pageNumber,
        size: query.pageSize,
        totalCount,
        items: [],
      });
    }

    const games = await this.gameRepo.find({
      where: { id: In(gameIds) },
      relations: {
        playerProgresses: { user: true, answers: true },
        gameToQuestions: { question: true },
      },
    });

    const sortedGames = gameIds.flatMap(
      (id) => games.find((g) => g.id === id) || [],
    );

    return BasePaginatedViewDto.mapToView({
      page: query.pageNumber,
      size: query.pageSize,
      totalCount,
      items: sortedGames.map((item) => GameViewDto.mapToView(item)),
    });
  }

  async findCurrent(userId: number): Promise<GameViewDto | null> {
    const gamePlayer = await this.playerProgressRepo.findOne({
      where: {
        game: { status: In([GameStatus.Pending, GameStatus.Active]) },
        user: { id: userId },
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

  async findCurrentOrNotFoundFail(userId: number): Promise<GameViewDto> {
    const game = await this.findCurrent(userId);

    if (!game) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'User does not have active game',
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

  async findByIdOrThrow(id: number, userId: number): Promise<GameViewDto> {
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
      ].includes(userId.toString())
    ) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'Game forbidden',
      });
    }

    return game;
  }
}
