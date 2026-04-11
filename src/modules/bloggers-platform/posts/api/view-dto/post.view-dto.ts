import {
  NewestLikeRaw,
  PostViewRaw,
} from '../../infrastructure/dto/post.aggregated-dto';
import { LikeStatus } from '../../../likes/enums/like-status';

interface NewestLike {
  addedAt: string;
  userId: string;
  login: string;
}

export class PostViewDto {
  id: string;
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
  blogName: string | null;
  createdAt: string;
  extendedLikesInfo: {
    dislikesCount: number;
    likesCount: number;
    myStatus: LikeStatus;
    newestLikes: NewestLike[];
  };

  static mapToView(post: PostViewRaw) {
    const dto = new PostViewDto();

    dto.id = post.id.toString();
    dto.title = post.title;
    dto.shortDescription = post.excerpt;
    dto.content = post.content;
    dto.blogId = post.blog_id.toString();
    dto.blogName = post.blog_name;
    dto.createdAt = post.created_at.toISOString();
    dto.extendedLikesInfo = {
      dislikesCount: post.dislikes_count,
      likesCount: post.likes_count,
      myStatus: post.user_like_status || LikeStatus.None,
      newestLikes: post.newest_likes.map((item) =>
        PostViewDto.newestLikeMapToView(item),
      ),
    };

    return dto;
  }

  protected static newestLikeMapToView(like: NewestLikeRaw): NewestLike {
    return {
      addedAt: like.addedAt,
      userId: like.userId.toString(),
      login: like.login,
    };
  }
}
