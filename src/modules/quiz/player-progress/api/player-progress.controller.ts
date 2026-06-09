import { Controller, Get, UseGuards } from '@nestjs/common';
import { PATH } from '../../../../core/constants/paths';
import { JwtAuthGuard } from '../../../user-accounts/guards/bearer/jwt-auth.guard';
import { ExtractUserFromRequestDecorator } from '../../../user-accounts/guards/decorators/param/extract-user-from-request.decorator';
import { UserContextDto } from '../../../user-accounts/guards/dto/user-context.dto';
import { PlayerProgressQueryRepository } from '../infrastucture/player-progress.query-repository';

const { PREFIX, MY_STATS } = PATH.PLAYER_PROGRESS;

@UseGuards(JwtAuthGuard)
@Controller(PREFIX)
export class PlayerProgressController {
  constructor(
    protected readonly playerProgressQueryRepository: PlayerProgressQueryRepository,
  ) {}

  @Get(MY_STATS)
  getMyStat(@ExtractUserFromRequestDecorator() user: UserContextDto) {
    return this.playerProgressQueryRepository.getUserStats(user.id);
  }
}
