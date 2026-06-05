import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateGameDto } from '../../dto/create-game.dto';
import { GameRepository } from '../../infrastucture/game.repository';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-code';
import { QuestionRepository } from '../../../question/infrastructure/question.repository';
import { GameStatus } from '../../enum/game-status';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Game } from '../../domain/game.entity';

export class ConnectGameCommand extends Command<number> {
  constructor(public readonly dto: CreateGameDto) {
    super();
  }
}

@CommandHandler(ConnectGameCommand)
export class ConnectGameUseCase implements ICommandHandler<ConnectGameCommand> {
  constructor(
    @InjectDataSource()
    protected readonly dataSource: DataSource,
    protected readonly repository: GameRepository,
    protected readonly questionRepository: QuestionRepository,
  ) {}

  async execute({ dto }: ConnectGameCommand): Promise<number> {
    const hasUserActiveGame = await this.repository.checkActiveGameForUser(
      dto.userId,
    );

    if (hasUserActiveGame) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'User has active game',
      });
    }

    const game = await this.repository.findPending();

    if (!game) {
      return this.dataSource.transaction<number>(async (entityManager) => {
        const newGame = await entityManager.save(this.repository.create());

        const playerProgress = this.repository.createPlayerProgress(
          newGame.id,
          dto.userId,
        );

        await entityManager.save(playerProgress);

        return newGame.id;
      });
    }

    return this.dataSource.transaction<number>(async (entityManager) => {
      const playerProgress = this.repository.createPlayerProgress(
        game.id,
        dto.userId,
      );

      await entityManager.save(playerProgress);

      const questions = await this.questionRepository.findForGame(5);
      const gameToQuestions = this.repository.createQuestions(
        game.id,
        questions.map(({ id }) => id),
      );

      await entityManager.save(gameToQuestions);

      await entityManager.update(
        Game,
        { id: game.id },
        {
          status: GameStatus.Active,
          startedAt: new Date(),
        },
      );

      return game.id;
    });
  }
}
