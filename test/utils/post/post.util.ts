import type { App } from 'supertest/types';
import request from 'supertest';
import { validAuth } from '../../constants/common';
import { blogDto, createBlog } from '../blog/blog.util';
import { CreatePostInputDto } from '../../../src/modules/bloggers-platform/posts/api/input-dto/create-post.input-dto';
import { UpdatePostInputDto } from '../../../src/modules/bloggers-platform/posts/api/input-dto/update-post.input-dto';
import { HttpStatus } from '@nestjs/common';
import { PostViewDto } from '../../../src/modules/bloggers-platform/posts/api/view-dto/post.view-dto';
import { BlogViewDto } from '../../../src/modules/bloggers-platform/blogs/api/view-dto/blog.view-dto';
import { CreateBlogInputDto } from '../../../src/modules/bloggers-platform/blogs/api/input-dto/create-blog.input-dto';
import { FULL_PATH } from '../../../src/core/constants/paths';

export const postDto: {
  create: CreatePostInputDto;
  update: UpdatePostInputDto;
} = {
  create: {
    title: 'Новые возможности TypeScript',
    shortDescription: 'Обзор новых фич и улучшений в TypeScript',
    content:
      'TypeScript 5.0 представляет множество улучшений производительности и новые возможности...',
    blogId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  },
  update: {
    title: 'React 18: Что нового?',
    shortDescription: 'Знакомство с новыми возможностями React 18',
    content:
      'React 18 приносит революционные изменения в рендеринг приложений...',
    blogId: 'b2c3d4e5-f6a7-890b-cdef-234567890123',
  },
};

export async function createPost(
  app: App,
  dto: CreatePostInputDto = postDto.create,
): Promise<PostViewDto> {
  const { body: post } = await request(app)
    .post(FULL_PATH.POSTS)
    .set('Authorization', validAuth)
    .send({ ...dto })
    .expect(HttpStatus.CREATED);

  return post;
}

export async function createPosts(
  count: number,
  app: App,
  dto: CreatePostInputDto = postDto.create,
): Promise<PostViewDto[]> {
  const requests = Array.from({ length: count }).map((_, index) =>
    createPost(app, {
      title: `${dto.title}${index}`,
      shortDescription: `${dto.shortDescription}${index}`,
      content: `${dto.content}${index}`,
      blogId: dto.blogId,
    }),
  );

  return Promise.all(requests);
}

export async function createBlogAndHisPost(
  app: App,
  dtoBlog: CreateBlogInputDto = blogDto.create,
  dtoPost: Omit<CreatePostInputDto, 'blogId'> = postDto.create,
): Promise<[BlogViewDto, PostViewDto]> {
  const blog = await createBlog(app, dtoBlog);
  const post = await createPost(app, { ...dtoPost, blogId: blog.id });

  return [blog, post];
}

export async function createBlogAndHisPosts(
  count: number,
  app: App,
  dtoBlog: CreateBlogInputDto = blogDto.create,
  dtoPost: Omit<CreatePostInputDto, 'blogId'> = postDto.create,
): Promise<[BlogViewDto, PostViewDto[]]> {
  const blog = await createBlog(app, dtoBlog);
  const posts = await createPosts(count, app, { ...dtoPost, blogId: blog.id });

  return [blog, posts];
}
