import { CommentDocument } from '../../domain/comment.entity';
import { UserDocument } from '../../../../user-accounts/domain/user.entity';
import { LikeStatus } from '../../../likes/enums/like-status';

export type AggregatedCommentDto = Omit<CommentDocument, 'author'> & {
  author: UserDocument;
  likesCount: number;
  dislikesCount: number;
  userLikeStatus?: LikeStatus | null;
};
