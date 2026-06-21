import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { PATH } from '../../../../core/constants/paths';
import { JwtAuthGuard } from '../../../user-accounts/guards/bearer/jwt-auth.guard';
import { ExtractUserFromRequestDecorator } from '../../../user-accounts/guards/decorators/param/extract-user-from-request.decorator';
import { UserContextDto } from '../../../user-accounts/guards/dto/user-context.dto';
import { PlayerProgressQueryRepository } from '../infrastucture/player-progress.query-repository';
import { TopQueryParamsInputDto } from './input-dto/top.query-params.input-dto';

const { PREFIX, MY_STATS, TOP } = PATH.PLAYER_PROGRESS;

@Controller(PREFIX)
export class PlayerProgressController {
  constructor(
    protected readonly playerProgressQueryRepository: PlayerProgressQueryRepository,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get(MY_STATS)
  getMyStat(@ExtractUserFromRequestDecorator() user: UserContextDto) {
    return this.playerProgressQueryRepository.getUserStats(user.id);
  }

  @Get(TOP)
  getTopList(@Query() query: TopQueryParamsInputDto) {
    return this.playerProgressQueryRepository.getUsersStats(query);
  }
}
