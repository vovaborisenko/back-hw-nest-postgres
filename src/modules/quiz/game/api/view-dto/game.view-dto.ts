import { GameStatus } from '../../enum/game-status';
import { Game } from '../../domain/game.entity';
import { Question } from '../../../question/domain/question.entity';
import { PlayerProgressViewDto } from '../../../player-progress/api/view-dto/player-progress.view-dto';
import { PlayerProgress } from '../../../player-progress/domain/player-progress.entity';

interface QuestionViewDto {
  id: string;
  body: string;
}

export class GameViewDto {
  id: string;
  firstPlayerProgress: PlayerProgressViewDto | null;
  secondPlayerProgress: PlayerProgressViewDto | null;
  questions: QuestionViewDto[] | null;
  status: GameStatus;
  pairCreatedDate: string;
  startGameDate: string | null;
  finishGameDate: string | null;

  static mapToView(dto: Game): GameViewDto {
    const view = new GameViewDto();
    const questions = dto.gameToQuestions;
    const playerProgresses = dto.playerProgresses.sort((a, b) => a.id - b.id);

    view.id = dto.id.toString();
    view.status = dto.status;
    view.pairCreatedDate = dto.createdAt.toISOString();
    view.startGameDate = dto.startedAt?.toISOString() ?? null;
    view.finishGameDate = dto.finishedAt?.toISOString() ?? null;
    view.questions =
      Array.isArray(questions) && questions.length
        ? questions.map(({ question }) => GameViewDto.questionToView(question))
        : null;

    view.firstPlayerProgress = this.playerProgressToView(playerProgresses[0]);
    view.secondPlayerProgress = this.playerProgressToView(playerProgresses[1]);

    return view;
  }

  private static questionToView(question: Question): QuestionViewDto {
    return {
      id: question.id.toString(),
      body: question.content,
    };
  }

  private static playerProgressToView(
    player?: PlayerProgress,
  ): PlayerProgressViewDto | null {
    if (!player) {
      return null;
    }

    return PlayerProgressViewDto.mapToView(player);
  }
}
