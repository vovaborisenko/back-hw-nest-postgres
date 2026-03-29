import { LikeStatus } from '../../enums/like-status';
import { IsEnum } from 'class-validator';

export class LikeInputDto {
  @IsEnum(LikeStatus)
  likeStatus: LikeStatus;
}
