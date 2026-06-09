import { BaseQueryParamsInputDto } from '../../../../../core/api/input-dto/base.query-params.input-dto';
import { IsEnum } from 'class-validator';
import { GamesSortBy } from './games.sort-by';

export class GetGamesQueryParamsInputDto extends BaseQueryParamsInputDto {
  @IsEnum(GamesSortBy)
  sortBy: GamesSortBy = GamesSortBy.CreatedAt;
}
