import { ConnectGameUseCase } from './usecases/connect-game.use-case';
import { UpdateGameScoreHandler } from './event-handlers/update-game-score.handler';

export const GameHandlers = [ConnectGameUseCase, UpdateGameScoreHandler];
