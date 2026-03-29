import { LikeStatus } from '../../enums/like-status';

export class CreateLikeDomainDto {
  status: LikeStatus;
  author: string;
  parent: string;
}
