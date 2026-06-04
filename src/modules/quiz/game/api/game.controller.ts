import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PATH } from '../../../../core/constants/paths';
import { BasePathParamsInputDto } from '../../../../core/api/input-dto/base.path-params.input-dto';
import { JwtAuthGuard } from '../../../user-accounts/guards/bearer/jwt-auth.guard';
import { ExtractUserFromRequestDecorator } from '../../../user-accounts/guards/decorators/param/extract-user-from-request.decorator';
import { UserContextDto } from '../../../user-accounts/guards/dto/user-context.dto';
import { CommandBus } from '@nestjs/cqrs';
import { ConnectGameCommand } from '../application/usecases/connect-game.use-case';
import { GameQueryRepository } from '../infrastucture/game.query-repository';
import { AnswerQuestionCommand } from '../../player-progress/application/usecases/answer-question.use-case';
import { AnswerQueryRepository } from '../../player-progress/infrastucture/answer.query-repository';
import { CreateAnswerInputDto } from '../../player-progress/api/input-dto/create-answer.input-dto';

const { PREFIX, SINGLE, NEW, CURRENT, ANSWER } = PATH.GAME;

@UseGuards(JwtAuthGuard)
@Controller(PREFIX)
export class GameController {
  constructor(
    protected readonly commandBus: CommandBus,
    protected readonly gameQueryRepository: GameQueryRepository,
    protected readonly answerQueryRepository: AnswerQueryRepository,
  ) {}

  @Get(CURRENT)
  getMyCurrent(@ExtractUserFromRequestDecorator() user: UserContextDto) {
    return this.gameQueryRepository.findCurrentOrNotFoundFail(user.id);
  }

  @Get(SINGLE)
  getGame(
    @Param() params: BasePathParamsInputDto,
    @ExtractUserFromRequestDecorator() user: UserContextDto,
  ) {
    return this.gameQueryRepository.findByIdOrThrow(params.id, user.id);
  }

  @Post(NEW)
  @HttpCode(HttpStatus.OK)
  async create(@ExtractUserFromRequestDecorator() user: UserContextDto) {
    const gameId = await this.commandBus.execute(
      new ConnectGameCommand({ userId: user.id }),
    );

    return this.gameQueryRepository.findByIdOrNotFoundFail(gameId);
  }

  @Post(ANSWER)
  @HttpCode(HttpStatus.OK)
  async answer(
    @ExtractUserFromRequestDecorator() user: UserContextDto,
    @Body() dto: CreateAnswerInputDto,
  ) {
    const answerId = await this.commandBus.execute(
      new AnswerQuestionCommand({ userId: user.id, answer: dto.answer }),
    );

    return this.answerQueryRepository.findByIdOrNotFoundFail(answerId);
  }
}
