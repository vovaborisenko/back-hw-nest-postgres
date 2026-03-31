import { Injectable } from '@nestjs/common';
import { BlogRaw } from '../domain/blog.entity';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-code';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CreateBlogDomainDto } from '../domain/dto/create-blog.domain.dto';
import { UpdateBlogDto } from '../dto/update-blog.dto';

@Injectable()
export class BlogsRepository {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async createBlog(blog: CreateBlogDomainDto): Promise<number> {
    const [{ id }] = await this.dataSource.query<[{ id: number }]>(
      `
    INSERT INTO blogs (name, description, website_url)
    VALUES ($1, $2, $3)
    RETURNING id
    `,
      [blog.name, blog.description, blog.websiteUrl],
    );

    return id;
  }

  async updateBlog(id: number, blog: UpdateBlogDto): Promise<boolean> {
    const [, updatedCount] = await this.dataSource.query<[void, number]>(
      `
    UPDATE blogs
    SET name = $2, description = $3, website_url = $4
    WHERE id = $1 and deleted_at is NULL
    `,
      [id, blog.name, blog.description, blog.websiteUrl],
    );

    return updatedCount > 0;
  }

  async deleteBlog(id: number): Promise<boolean> {
    const [, deletedCount] = await this.dataSource.query<[void, number]>(
      `
    UPDATE blogs
    SET deleted_at = $2
    WHERE id = $1 and deleted_at is NULL
    `,
      [id, new Date()],
    );

    return deletedCount > 0;
  }

  async findById(id: number): Promise<BlogRaw | null> {
    const [blog = null] = await this.dataSource.query<BlogRaw[]>(
      `
        SELECT * 
        FROM blogs 
        WHERE id = $1 AND deleted_at is NULL
      `,
      [id],
    );

    return blog;
  }

  async findByIdOrNotFound(id: number): Promise<BlogRaw> {
    const blog = await this.findById(id);

    if (!blog) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Blog not found',
      });
    }

    return blog;
  }
}
