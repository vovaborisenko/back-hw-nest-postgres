import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlayerProgress } from '../domain/player-progress.entity';
import { UserStatsViewDto } from '../api/view-dto/user-stats.view-dto';

@Injectable()
export class PlayerProgressQueryRepository {
  constructor(
    @InjectRepository(PlayerProgress)
    protected readonly playerProgressRepo: Repository<PlayerProgress>,
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
      .getRawOne<UserStatsViewDto>();

    return {
      sumScore: Number(result?.sumScore) || 0,
      avgScores: Number(Number(result?.avgScores).toFixed(2)) || 0,
      gamesCount: Number(result?.gamesCount) || 0,
      winsCount: Number(result?.winsCount) || 0,
      lossesCount: Number(result?.lossesCount) || 0,
      drawsCount: Number(result?.drawsCount) || 0,
    };
  }
}
