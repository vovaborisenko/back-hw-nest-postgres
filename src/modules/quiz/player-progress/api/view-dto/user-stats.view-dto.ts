import { UserStatsDto } from '../../dto/user-stats.dto';

export class UserStatsViewDto {
  sumScore: number;
  avgScores: number;
  gamesCount: number;
  winsCount: number;
  lossesCount: number;
  drawsCount: number;

  static mapToView(dto: UserStatsDto): UserStatsViewDto {
    const view = new UserStatsViewDto();

    view.sumScore = Number(dto.sumScore) || 0;
    view.avgScores = Number(Number(dto.avgScores).toFixed(2)) || 0;
    view.gamesCount = Number(dto.gamesCount) || 0;
    view.winsCount = Number(dto.winsCount) || 0;
    view.lossesCount = Number(dto.lossesCount) || 0;
    view.drawsCount = Number(dto.drawsCount) || 0;

    return view;
  }
}
