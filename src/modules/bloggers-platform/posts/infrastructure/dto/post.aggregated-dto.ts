import { PostDocument } from '../../domain/post.entity';
import { BlogDocument } from '../../../blogs/domain/blog.entity';
import { LikeStatus } from '../../../likes/enums/like-status';

interface NewestLike {
  addedAt: Date;
  userId: string;
  login: string;
}

export type AggregatedPostDto = Omit<PostDocument, 'blog'> & {
  blog: BlogDocument;
  extendedLikesInfo: {
    likesCount: number;
    dislikesCount: number;
    myStatus: LikeStatus;
    newestLikes: NewestLike[];
  };
};
