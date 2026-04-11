import { PostRaw } from '../../domain/post.entity';
import { LikeStatus } from '../../../likes/enums/like-status';

export interface NewestLikeRaw {
  addedAt: string;
  userId: number;
  login: string;
}

export interface PostViewRaw extends PostRaw {
  blog_name: string;
  likes_count: number;
  dislikes_count: number;
  user_like_status: LikeStatus;
  newest_likes: NewestLikeRaw[];
}
