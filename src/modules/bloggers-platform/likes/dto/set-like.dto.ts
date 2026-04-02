import { LikeStatus } from '../enums/like-status';

export class SetLikeDto {
  status: LikeStatus;
  author: number;
  parent: number;
}
