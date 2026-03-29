import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Post } from '../domain/post.entity';
import type { PostModelType } from '../domain/post.entity';
import { PostsRepository } from '../infrastructure/posts.repository';
import { CreatePostDto } from '../dto/create-post.dto';
import { UpdatePostDto } from '../dto/update-post.dto';
import { BlogsRepository } from '../../blogs/infrastructure/blogs.repository';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name) private PostModel: PostModelType,
    private readonly postsRepository: PostsRepository,
    private readonly blogsRepository: BlogsRepository,
  ) {}

  async createPost(dto: CreatePostDto): Promise<string> {
    await this.blogsRepository.findByIdOrNotFound(dto.blogId);

    const post = this.PostModel.createInstance(dto);

    await this.postsRepository.save(post);

    return post._id.toString();
  }

  async updatePost(id: string, dto: UpdatePostDto): Promise<void> {
    if (dto.blogId) {
      await this.blogsRepository.findByIdOrNotFound(dto.blogId);
    }

    const post = await this.postsRepository.findByIdOrNotFound(id);

    post.update(dto);

    await this.postsRepository.save(post);
  }

  async deletePost(id: string): Promise<void> {
    const post = await this.postsRepository.findByIdOrNotFound(id);

    post.makeDeleted();

    await this.postsRepository.save(post);
  }
}
