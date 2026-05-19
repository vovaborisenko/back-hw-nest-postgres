import type { Blog } from '../../../blogs/domain/blog.entity';

export class CreatePostDomainDto {
  title: string;
  shortDescription: string;
  content: string;
  blog: Blog;
}
