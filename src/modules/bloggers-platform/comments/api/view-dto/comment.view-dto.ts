import { CommentViewRaw } from '../../infrastructure/dto/comment.aggregated-dto';
import { LikeStatus } from '../../../likes/enums/like-status';

export class CommentViewDto {
  id: string;
  content: string;
  commentatorInfo: {
    userId: string;
    userLogin: string;
  };
  likesInfo: {
    dislikesCount: number;
    likesCount: number;
    myStatus: string;
  };
  createdAt: string;

  static mapToView(comment: CommentViewRaw) {
    const dto = new CommentViewDto();

    dto.id = comment.id.toString();
    dto.content = comment.content;
    dto.commentatorInfo = {
      userId: comment.user_id.toString(),
      userLogin: comment.user_login,
    };
    dto.likesInfo = {
      dislikesCount: comment.dislikes_count || 0,
      likesCount: comment.likes_count || 0,
      myStatus: comment.user_like_status || LikeStatus.None,
    };
    dto.createdAt = comment.created_at.toISOString();

    return dto;
  }
}
