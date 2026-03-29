import { AggregatedPostDto } from '../../infrastructure/dto/post.aggregated-dto';
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

  static mapToView(post: AggregatedPostDto) {
    const dto = new PostViewDto();

    dto.id = post._id.toString();
    dto.title = post.title;
    dto.shortDescription = post.shortDescription;
    dto.content = post.content;
    dto.blogId = post.blog._id.toString();
    dto.blogName = 'name' in post.blog ? post.blog.name : null;
    dto.createdAt = post.createdAt.toISOString();
    dto.extendedLikesInfo = {
      ...post.extendedLikesInfo,
      newestLikes: post.extendedLikesInfo.newestLikes.map((like) => ({
        ...like,
        addedAt: like.addedAt.toISOString(),
      })),
    };

    return dto;
  }
}
