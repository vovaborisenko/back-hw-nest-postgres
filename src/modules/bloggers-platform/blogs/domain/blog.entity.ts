import { CreateBlogDomainDto } from './dto/create-blog.domain.dto';
import { Column, Entity, OneToMany } from 'typeorm';
import { BaseDbEntity } from '../../../../core/domain/baseDbEntity';
import { Post } from '../../posts/domain/post.entity';

@Entity()
export class Blog extends BaseDbEntity {
  @Column()
  name: string;

  @Column()
  description: string;

  @Column()
  websiteUrl: string;

  @Column({ default: false })
  isMembership: boolean;

  @OneToMany(() => Post, (post) => post.blog)
  posts: Post[];

  static create(dto: CreateBlogDomainDto): Blog {
    const blog = new this();

    blog.name = dto.name;
    blog.description = dto.description;
    blog.websiteUrl = dto.websiteUrl;

    return blog;
  }
}
