import { NewestLikeRaw } from '../../infrastructure/dto/post.aggregated-dto';
import { LikeStatus } from '../../../likes/enums/like-status';
import { Post } from '../../domain/post.entity';

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

  static mapToView(post: Post) {
    const dto = new PostViewDto();

    dto.id = post.id.toString();
    dto.title = post.title;
    dto.shortDescription = post.shortDescription;
    dto.content = post.content;
    dto.blogId = post.blog.id.toString();
    dto.blogName = post.blog.name;
    dto.createdAt = post.createdAt.toISOString();
    dto.extendedLikesInfo = {
      dislikesCount: 0,
      // dislikesCount: post.dislikes_count || 0,
      likesCount: 0,
      // likesCount: post.likes_count || 0,
      myStatus: LikeStatus.None,
      // myStatus: post.user_like_status || LikeStatus.None,
      newestLikes: [], // post.newest_likes.map((item) =>
      //   PostViewDto.newestLikeMapToView(item),
      // ),
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
