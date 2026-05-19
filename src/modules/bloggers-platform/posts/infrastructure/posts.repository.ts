import { Injectable } from '@nestjs/common';
import { Post } from '../domain/post.entity';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-code';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { CreatePostDto } from '../dto/create-post.dto';
import { UpdatePostDto } from '../dto/update-post.dto';
import { Blog } from '../../blogs/domain/blog.entity';

@Injectable()
export class PostsRepository {
  constructor(
    @InjectRepository(Post) private readonly postRepo: Repository<Post>,
  ) {}

  async createPost(dto: CreatePostDto, blog: Blog): Promise<number> {
    const post = Post.create({ ...dto, blog });

    await this.postRepo.save(post);

    return post.id;
  }

  async updatePost(id: number, dto: UpdatePostDto): Promise<void> {
    const post = await this.findByIdOrNotFound(id);

    post.title = dto.title;
    post.shortDescription = dto.shortDescription;
    post.content = dto.content;

    await this.postRepo.save(post);
  }

  async deletePost(id: number): Promise<boolean> {
    const { affected = 0 } = await this.postRepo.softDelete({
      id,
      deletedAt: IsNull(),
    });

    return affected > 0;
  }

  findById(id: number): Promise<Post | null> {
    return this.postRepo.findOneBy({ id });
  }

  async findByIdOrNotFound(id: number): Promise<Post> {
    const post = await this.findById(id);

    if (!post) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Post not found',
      });
    }

    return post;
  }
}
