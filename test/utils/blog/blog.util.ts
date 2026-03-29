import type { App } from 'supertest/types';
import request from 'supertest';
import { validAuth } from '../../constants/common';
import { CreateBlogInputDto } from '../../../src/modules/bloggers-platform/blogs/api/input-dto/create-blog.input-dto';
import { UpdateBlogInputDto } from '../../../src/modules/bloggers-platform/blogs/api/input-dto/update-blog.input-dto';
import { HttpStatus } from '@nestjs/common';
import { BlogViewDto } from '../../../src/modules/bloggers-platform/blogs/api/view-dto/blog.view-dto';
import { FULL_PATH } from '../../../src/core/constants/paths';

export const blogDto: {
  create: CreateBlogInputDto;
  update: UpdateBlogInputDto;
} = {
  create: {
    name: 'Tech Insights',
    description: 'Latest news and trends in technology world',
    websiteUrl: 'https://tech-insights.blog.com',
  },
  update: {
    name: 'Web Guide',
    description: 'Helpful articles and tutorials on web development',
    websiteUrl: 'https://webdev-guide.dev',
  },
};

export async function createBlog(
  app: App,
  dto: CreateBlogInputDto = blogDto.create,
): Promise<BlogViewDto> {
  const { body: blog } = await request(app)
    .post(FULL_PATH.BLOGS)
    .set('Authorization', validAuth)
    .send(dto)
    .expect(HttpStatus.CREATED);

  return blog;
}

export async function createBlogs(
  count: number,
  app: App,
  dto: CreateBlogInputDto = blogDto.create,
): Promise<BlogViewDto[]> {
  const requests = Array.from({ length: count }).map((_, index) =>
    createBlog(app, {
      name: `${dto.name}${index}`,
      description: `${dto.description}${index}`,
      websiteUrl: `${dto.websiteUrl}${index}`,
    }),
  );

  return Promise.all(requests);
}
