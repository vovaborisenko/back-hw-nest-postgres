import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AnswerAddedEvent } from '../../../player-progress/application/events/answer-added.event';
import { PlayerProgress } from '../../../player-progress/domain/player-progress.entity';
import { Game } from '../../domain/game.entity';
import { AnswerStatus } from '../../../player-progress/enum/answer-status';
import { GameRepository } from '../../infrastucture/game.repository';
import { GameStatus } from '../../enum/game-status';

@EventsHandler(AnswerAddedEvent)
export class UpdateGameScoreHandler implements IEventHandler<AnswerAddedEvent> {
  constructor(
    @InjectDataSource()
    protected readonly dataSource: DataSource,
    protected readonly gameRepository: GameRepository,
  ) {}

  async handle({ playerProgressId, gameId }: AnswerAddedEvent) {
    const game = await this.gameRepository.findById(gameId);

    if (!game) return;

    const isLastAnswer = game.playerProgresses.every(
      ({ answers }) => answers.length === game.gameToQuestions.length,
    );

    const playerProgress = game.playerProgresses.find(
      ({ id }) => id === playerProgressId,
    );

    if (!playerProgress) return;

    const score = playerProgress.answers.filter(
      ({ status }) => status === AnswerStatus.Correct,
    ).length;

    if (!isLastAnswer) {
      return this.dataSource.transaction(async (manager) => {
        await manager.update(
          PlayerProgress,
          { id: playerProgressId },
          { score },
        );
      });
    }

    const playerProgressWithAdditionalPoint = game.playerProgresses.reduce(
      (result, playerProgress) => {
        if (
          playerProgress.score > 0 &&
          playerProgress.answers.length > result.answers.length
        ) {
          return playerProgress;
        }

        return result;
      },
      { id: null, answers: [] },
    );

    return this.dataSource.transaction(async (manager) => {
      await manager.update(
        Game,
        { id: gameId },
        { status: GameStatus.Finished, finishedAt: new Date() },
      );

      if (playerProgressWithAdditionalPoint.id === playerProgressId) {
        console.warn('current player');
        return manager.update(
          PlayerProgress,
          { id: playerProgressId },
          { score: score + 1 },
        );
      }

      if (playerProgress.score < score) {
        await manager.update(
          PlayerProgress,
          { id: playerProgressId },
          { score },
        );
      }

      if (playerProgressWithAdditionalPoint.id) {
        console.warn('another player');
        return manager.update(
          PlayerProgress,
          { id: playerProgressWithAdditionalPoint.id },
          { score: playerProgressWithAdditionalPoint.score + 1 },
        );
      }
    });
  }
}
