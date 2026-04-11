import { LikeStatus } from '../enums/like-status';
import { LikeParent } from '../enums/like-parent';

export class SetLikeDto {
  status: LikeStatus;
  userId: number;
  parentId: number;
  parentEntity: LikeParent;
}
