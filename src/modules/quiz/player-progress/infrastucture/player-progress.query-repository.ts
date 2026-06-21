import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PlayerProgress } from '../domain/player-progress.entity';
import { UserStatsViewDto } from '../api/view-dto/user-stats.view-dto';
import { UserStatsDto } from '../dto/user-stats.dto';
import { TopQueryParamsInputDto } from '../api/input-dto/top.query-params.input-dto';
import { BasePaginatedViewDto } from '../../../../core/api/view-dto/base.paginated.view-dto';
import { User } from '../../../user-accounts/domain/user.entity';
import { TopUserStatsDto } from '../dto/top-user-stats.dto';
import { TopUserStatsViewDto } from '../api/view-dto/top-user-stats.view-dto';

@Injectable()
export class PlayerProgressQueryRepository {
  constructor(
    @InjectRepository(PlayerProgress)
    protected readonly playerProgressRepo: Repository<PlayerProgress>,
    private dataSource: DataSource,
  ) {}

  async getUserStats(userId: number): Promise<UserStatsViewDto> {
    const result = await this.playerProgressRepo
      .createQueryBuilder('pp')
      .select('SUM(pp.score)', 'sumScore')
      .addSelect('AVG(pp.score)', 'avgScores')
      .addSelect('COUNT(pp.id)', 'gamesCount')
      .addSelect(
        `SUM(CASE WHEN pp.gameResult = 'WIN' THEN 1 ELSE 0 END)`,
        'winsCount',
      )
      .addSelect(
        `SUM(CASE WHEN pp.gameResult = 'LOSE' THEN 1 ELSE 0 END)`,
        'lossesCount',
      )
      .addSelect(
        `SUM(CASE WHEN pp.gameResult = 'DRAW' THEN 1 ELSE 0 END)`,
        'drawsCount',
      )
      .where('pp.userId = :userId', { userId })
      .getRawOne<UserStatsDto>();

    if (!result) {
      return {
        sumScore: 0,
        avgScores: 0,
        gamesCount: 0,
        winsCount: 0,
        lossesCount: 0,
        drawsCount: 0,
      };
    }

    return UserStatsViewDto.mapToView(result);
  }

  async getUsersStats(
    query: TopQueryParamsInputDto,
  ): Promise<BasePaginatedViewDto<UserStatsViewDto[]>> {
    const statsQuery = this.playerProgressRepo
      .createQueryBuilder('pp')
      .select('SUM(pp.score)', 'sumScore')
      .addSelect('AVG(pp.score)', 'avgScores')
      .addSelect('COUNT(pp.id)', 'gamesCount')
      .addSelect(
        `SUM(CASE WHEN pp.gameResult = 'WIN' THEN 1 ELSE 0 END)`,
        'winsCount',
      )
      .addSelect(
        `SUM(CASE WHEN pp.gameResult = 'LOSE' THEN 1 ELSE 0 END)`,
        'lossesCount',
      )
      .addSelect(
        `SUM(CASE WHEN pp.gameResult = 'DRAW' THEN 1 ELSE 0 END)`,
        'drawsCount',
      )
      .addSelect('pp.userId', 'userId')
      .groupBy('pp.userId');

    const statsQb = this.dataSource
      .createQueryBuilder()
      .from(User, 'u')
      .innerJoin(`(${statsQuery.getQuery()})`, 's', 'u.id = s."userId"')
      .setParameters(statsQuery.getParameters())
      .select('u.id', 'userId')
      .addSelect('u.login', 'userLogin')
      .addSelect('s."sumScore"', 'sumScore')
      .addSelect('s."avgScores"', 'avgScores')
      .addSelect('s."gamesCount"', 'gamesCount')
      .addSelect('s."winsCount"', 'winsCount')
      .addSelect('s."lossesCount"', 'lossesCount')
      .addSelect('s."drawsCount"', 'drawsCount');

    if (query.sort.length) {
      statsQb.orderBy(
        Object.fromEntries(
          query.sort.map((item) => {
            const [key, value = 'ASC'] = item.split(' ');

            return [`s."${key}"`, value as 'ASC' | 'DESC'];
          }),
        ),
      );
    }

    const resultTotalCount = await this.playerProgressRepo
      .createQueryBuilder('pp')
      .select('COUNT(DISTINCT pp.userId)', 'totalCount')
      .getRawOne<{ totalCount: string }>();

    const result = await statsQb
      .offset(query.skip)
      .limit(query.pageSize)
      .getRawMany<TopUserStatsDto>();

    return BasePaginatedViewDto.mapToView({
      page: query.pageNumber,
      size: query.pageSize,
      totalCount: Number(resultTotalCount?.totalCount) || 0,
      items: result.map((item) => TopUserStatsViewDto.mapToView(item)),
    });
  }
}
