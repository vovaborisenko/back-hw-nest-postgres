import { UserStatsDto } from './user-stats.dto';

export interface TopUserStatsDto extends UserStatsDto {
  userId: number;
  userLogin: string;
  totalCount: number;
}
