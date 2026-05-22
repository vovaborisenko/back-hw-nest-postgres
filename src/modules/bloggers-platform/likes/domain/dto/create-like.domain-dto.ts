import { LikeStatus } from '../../enums/like-status';
import { LikeParent } from '../../enums/like-parent';

export class CreateLikeDomainDto {
  status: LikeStatus;
  userId: number;
  parentId: number;
  parentType: LikeParent;
}
