import { Injectable } from '@nestjs/common';
import { PostRaw } from '../domain/post.entity';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-code';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CreatePostDto } from '../dto/create-post.dto';
import { UpdatePostDto } from '../dto/update-post.dto';

@Injectable()
export class PostsRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async createPost(post: CreatePostDto): Promise<number> {
    const [{ id }] = await this.dataSource.query<[{ id: number }]>(
      `
    INSERT INTO posts (title, excerpt, content, blog_id)
    VALUES ($1, $2, $3, $4)
    RETURNING id
    `,
      [post.title, post.shortDescription, post.content, post.blogId],
    );

    return id;
  }

  async updatePost(id: number, post: UpdatePostDto): Promise<boolean> {
    const [, updatedCount] = await this.dataSource.query<[void, number]>(
      `
    UPDATE posts
    SET title = $2, excerpt = $3, content = $4
    WHERE id = $1 and blog_id = $5 and deleted_at is NULL
    `,
      [id, post.title, post.shortDescription, post.content, post.blogId],
    );

    return updatedCount > 0;
  }

  async deletePost(id: number): Promise<boolean> {
    const [, deletedCount] = await this.dataSource.query<[void, number]>(
      `
    UPDATE posts
    SET deleted_at = $2
    WHERE id = $1 and deleted_at is NULL
    `,
      [id, new Date()],
    );

    return deletedCount > 0;
  }

  async findById(id: number): Promise<PostRaw | null> {
    const [post = null] = await this.dataSource.query<PostRaw[]>(
      `SELECT * 
      FROM posts 
      WHERE id = $1 AND deleted_at is null`,
      [id],
    );

    return post;
  }

  async findByIdOrNotFound(id: number): Promise<PostRaw> {
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
