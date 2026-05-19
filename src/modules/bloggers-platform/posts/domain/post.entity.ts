import { CreatePostDomainDto } from './dto/create-post.domain.dto';
import { Blog } from '../../blogs/domain/blog.entity';
import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseDbEntity } from '../../../../core/domain/baseDbEntity';

@Entity()
export class Post extends BaseDbEntity {
  @Column()
  title: string;

  @Column()
  shortDescription: string;

  @Column()
  content: string;

  @ManyToOne(() => Blog, (blog) => blog.posts)
  blog: Blog;

  static create(dto: CreatePostDomainDto): Post {
    const post = new this();

    post.title = dto.title;
    post.content = dto.content;
    post.shortDescription = dto.shortDescription;
    post.blog = dto.blog;

    return post;
  }
}
