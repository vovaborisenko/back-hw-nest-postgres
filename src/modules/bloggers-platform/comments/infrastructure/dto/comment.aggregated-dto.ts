import { CommentRaw } from '../../domain/comment.entity';
import { LikeStatus } from '../../../likes/enums/like-status';

export interface CommentViewRaw extends CommentRaw {
  user_login: string;
  likes_count: number;
  dislikes_count: number;
  user_like_status: LikeStatus | null;
}
