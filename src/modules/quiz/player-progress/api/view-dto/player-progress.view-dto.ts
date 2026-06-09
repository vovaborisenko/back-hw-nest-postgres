import { PlayerProgress } from '../../domain/player-progress.entity';
import { AnswerViewDto } from './answer.view-dto';

interface PlayerViewDto {
  id: string;
  login: string;
}

export class PlayerProgressViewDto {
  answers: AnswerViewDto[];
  player: PlayerViewDto;
  score: number;

  static mapToView(dto: PlayerProgress): PlayerProgressViewDto {
    const view = new PlayerProgressViewDto();

    view.score = dto.score;
    view.player = {
      id: dto.userId.toString(),
      login: dto.user.login,
    };
    view.answers = dto.answers
      .sort((a, b) => a.id - b.id)
      .map((answer) => AnswerViewDto.mapToView(answer));

    return view;
  }
}
