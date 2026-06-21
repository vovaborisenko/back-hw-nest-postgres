import { UserStatsViewDto } from './user-stats.view-dto';
import { TopUserStatsDto } from '../../dto/top-user-stats.dto';

interface PlayerViewDto {
  id: string;
  login: string;
}

export class TopUserStatsViewDto extends UserStatsViewDto {
  player: PlayerViewDto;

  static mapToView(dto: TopUserStatsDto): TopUserStatsViewDto {
    const view = Object.assign(new TopUserStatsViewDto(), super.mapToView(dto));

    view.player = {
      id: dto.userId.toString(),
      login: dto.userLogin,
    };

    return view;
  }
}
