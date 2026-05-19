import { Injectable } from '@nestjs/common';
import { Blog } from '../domain/blog.entity';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-code';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { CreateBlogDomainDto } from '../domain/dto/create-blog.domain.dto';
import { UpdateBlogDto } from '../dto/update-blog.dto';

@Injectable()
export class BlogsRepository {
  constructor(
    @InjectRepository(Blog)
    private readonly blogRepo: Repository<Blog>,
  ) {}

  async createBlog(dto: CreateBlogDomainDto): Promise<number> {
    const blog = Blog.create(dto);

    await this.blogRepo.save(blog);

    return blog.id;
  }

  async updateBlogOrNotFound(id: number, dto: UpdateBlogDto): Promise<void> {
    const blog = await this.findByIdOrNotFound(id);

    blog.name = dto.name;
    blog.description = dto.description;
    blog.websiteUrl = dto.websiteUrl;

    await this.blogRepo.save(blog);
  }

  async deleteBlog(id: number): Promise<boolean> {
    const { affected = 0 } = await this.blogRepo.softDelete({
      id,
      deletedAt: IsNull(),
    });

    return affected > 0;
  }

  findById(id: number): Promise<Blog | null> {
    return this.blogRepo.findOneBy({ id });
  }

  async findByIdOrNotFound(id: number): Promise<Blog> {
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
