import type { App } from 'supertest/types';
import request from 'supertest';
import { createUserAndLogin } from '../user/user.util';
import { createBlogAndHisPost } from '../post/post.util';
import { CreatePostCommentDto } from '../../../src/modules/bloggers-platform/posts/dto/create-post-comment.dto';
import { UpdateCommentDto } from '../../../src/modules/bloggers-platform/comments/dto/update-comment.dto';
import { PostViewDto } from '../../../src/modules/bloggers-platform/posts/api/view-dto/post.view-dto';
import { FULL_PATH } from '../../../src/core/constants/paths';
import { HttpStatus } from '@nestjs/common';
import { UserViewDto } from '../../../src/modules/user-accounts/api/view-dto/users.view-dto';
import { LikeInputDto } from '../../../src/modules/bloggers-platform/likes/api/input-dto/like.input-dto';
import { LikeStatus } from '../../../src/modules/bloggers-platform/likes/enums/like-status';

export const commentDto: {
  create: CreatePostCommentDto;
  update: UpdateCommentDto;
  updateLikeStatus: LikeInputDto[];
} = {
  create: {
    content:
      'TypeScript 5.0 представляет множество улучшений производительности и новые возможности...',
  },
  update: {
    content:
      'React 18 приносит революционные изменения в рендеринг приложений...',
  },
  updateLikeStatus: [
    {
      likeStatus: LikeStatus.Like,
    },
    {
      likeStatus: LikeStatus.Dislike,
    },
    {
      likeStatus: LikeStatus.None,
    },
  ],
};

export async function createComment(
  app: App,
  dto: CreatePostCommentDto = commentDto.create,
): Promise<[any, PostViewDto, string, UserViewDto]> {
  const { token, user } = await createUserAndLogin(app);
  const [, post] = await createBlogAndHisPost(app);
  const { body: comment } = await request(app)
    .post(`${FULL_PATH.POSTS}/${post.id}/comments`)
    .set('Authorization', `Bearer ${token}`)
    .send(dto)
    .expect(HttpStatus.CREATED);

  return [comment, post, token, user];
}

export async function createComments(
  count: number,
  app: App,
  dto: CreatePostCommentDto = commentDto.create,
): Promise<[any[], PostViewDto, string]> {
  const { token } = await createUserAndLogin(app);
  const [, post] = await createBlogAndHisPost(app);
  const requests = Array.from({ length: count }).map((_, index) =>
    request(app)
      .post(`${FULL_PATH.POSTS}/${post.id}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: `${dto.content}${index}` })
      .expect(HttpStatus.CREATED)
      .then(({ body }) => body),
  );
  const comments = await Promise.all(requests);

  return [comments, post, token];
}
