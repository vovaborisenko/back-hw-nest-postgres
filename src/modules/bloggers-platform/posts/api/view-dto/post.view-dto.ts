import { PostViewRaw } from '../../infrastructure/dto/post.aggregated-dto';
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
      dislikesCount: 0,
      likesCount: 0,
      myStatus: LikeStatus.None,
      newestLikes: [],
    };
    // dto.extendedLikesInfo = {
    //   ...post.extendedLikesInfo,
    //   newestLikes: post.extendedLikesInfo.newestLikes.map((like) => ({
    //     ...like,
    //     addedAt: like.addedAt.toISOString(),
    //   })),
    // };

    return dto;
  }
}
