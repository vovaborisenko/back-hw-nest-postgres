import { LikeStatus } from '../../../likes/enums/like-status';
import { Comment } from '../../domain/comment.entity';

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

  static mapToView(
    comment: Comment,
    myStatus: LikeStatus,
    likesCount: number,
    dislikesCount: number,
  ): CommentViewDto {
    const dto = new CommentViewDto();

    dto.id = comment.id.toString();
    dto.content = comment.content;
    dto.commentatorInfo = {
      userId: comment.author.id.toString(),
      userLogin: comment.author.login,
    };
    dto.likesInfo = {
      dislikesCount,
      likesCount,
      myStatus,
    };
    dto.createdAt = comment.createdAt.toISOString();

    return dto;
  }
}
