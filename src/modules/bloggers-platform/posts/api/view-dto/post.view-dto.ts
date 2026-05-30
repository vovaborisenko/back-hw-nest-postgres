import { LikeStatus } from '../../../likes/enums/like-status';
import { Post } from '../../domain/post.entity';
import { Like } from '../../../likes/domain/like.entity';

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

  static mapToView(
    post: Post,
    newestLikes: Like[],
    myStatus: LikeStatus,
    likesCount: number,
    dislikesCount: number,
  ): PostViewDto {
    const dto = new PostViewDto();

    dto.id = post.id.toString();
    dto.title = post.title;
    dto.shortDescription = post.shortDescription;
    dto.content = post.content;
    dto.blogId = post.blog.id.toString();
    dto.blogName = post.blog.name;
    dto.createdAt = post.createdAt.toISOString();
    dto.extendedLikesInfo = {
      dislikesCount,
      likesCount,
      myStatus,
      newestLikes: newestLikes.map((item) =>
        PostViewDto.newestLikeMapToView(item),
      ),
    };

    return dto;
  }

  protected static newestLikeMapToView(like: Like): NewestLike {
    return {
      addedAt: like.createdAt.toISOString(),
      userId: like.author.id.toString(),
      login: like.author.login,
    };
  }
}
