import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Blog } from '../domain/blog.entity';
import type { BlogModelType } from '../domain/blog.entity';
import { BlogsRepository } from '../infrastructure/blogs.repository';
import { CreateBlogDto } from '../dto/create-blog.dto';
import { UpdateBlogDto } from '../dto/update-blog.dto';

@Injectable()
export class BlogsService {
  constructor(
    @InjectModel(Blog.name) private BlogModel: BlogModelType,
    private readonly blogsRepository: BlogsRepository,
  ) {}

  async createBlog(dto: CreateBlogDto): Promise<string> {
    const blog = this.BlogModel.createInstance(dto);

    await this.blogsRepository.save(blog);

    return blog._id.toString();
  }

  async updateBlog(id: string, dto: UpdateBlogDto): Promise<void> {
    const blog = await this.blogsRepository.findByIdOrNotFound(id);

    blog.update(dto);

    await this.blogsRepository.save(blog);
  }

  async deleteBlog(id: string): Promise<void> {
    const blog = await this.blogsRepository.findByIdOrNotFound(id);

    blog.makeDeleted();

    await this.blogsRepository.save(blog);
  }
}
