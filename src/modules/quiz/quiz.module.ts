import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Question } from './question/domain/question.entity';
import { QuestionController } from './question/api/question.controller';
import { QuestionQueryRepository } from './question/infrastructure/question.query-repository';
import { QuestionHandles } from './question/application';
import { QuestionRepository } from './question/infrastructure/question.repository';
import { Game } from './game/domain/game.entity';
import { GameRepository } from './game/infrastucture/game.repository';
import { GameHandlers } from './game/application';
import { GameController } from './game/api/game.controller';
import { GameQueryRepository } from './game/infrastucture/game.query-repository';
import { GameToQuestion } from './game/domain/question-to-game.entity';
import { PlayerProgress } from './player-progress/domain/player-progress.entity';
import { Answer } from './player-progress/domain/answer.entity';
import { PlayerProgressHandlers } from './player-progress/application';
import { PlayerProgressRepository } from './player-progress/infrastucture/player-progress.repository';
import { AnswerQueryRepository } from './player-progress/infrastucture/answer.query-repository';
import { PlayerProgressQueryRepository } from './player-progress/infrastucture/player-progress.query-repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Question,
      Game,
      GameToQuestion,
      PlayerProgress,
      Answer,
    ]),
  ],
  controllers: [QuestionController, GameController],
  providers: [
    QuestionRepository,
    QuestionQueryRepository,
    ...QuestionHandles,
    GameRepository,
    GameQueryRepository,
    ...GameHandlers,
    ...PlayerProgressHandlers,
    PlayerProgressRepository,
    PlayerProgressQueryRepository,
    AnswerQueryRepository,
  ],
})
export class QuizModule {}
