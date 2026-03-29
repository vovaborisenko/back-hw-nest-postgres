import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model, Types } from 'mongoose';
import { CreatePostDomainDto } from './dto/create-post.domain.dto';
import { UpdatePostDto } from '../dto/update-post.dto';
import { Blog } from '../../blogs/domain/blog.entity';

@Schema({ timestamps: true })
export class Post {
  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: String, required: true })
  shortDescription: string;

  @Prop({ type: String, required: true })
  content: string;

  @Prop({ type: Types.ObjectId, ref: Blog.name, required: true })
  blog: Types.ObjectId;

  createdAt: Date;

  @Prop({ type: Date, nullable: true, default: null })
  deletedAt: Date | null;

  static createInstance(dto: CreatePostDomainDto) {
    const post = new this();

    post.title = dto.title;
    post.content = dto.content;
    post.shortDescription = dto.shortDescription;
    post.blog = new Types.ObjectId(dto.blogId);

    return post as PostDocument;
  }

  update(dto: UpdatePostDto): void {
    this.title = dto.title || this.title;
    this.content = dto.content || this.content;
    this.shortDescription = dto.shortDescription || this.shortDescription;
    this.blog = dto.blogId ? new Types.ObjectId(dto.blogId) : this.blog;
  }

  makeDeleted(): void {
    if (this.deletedAt !== null) {
      throw new Error('Entity already deleted');
    }

    this.deletedAt = new Date();
  }
}

export const PostSchema = SchemaFactory.createForClass(Post);

PostSchema.loadClass(Post);

export type PostDocument = HydratedDocument<Post>;
export type PostModelType = Model<PostDocument> & typeof Post;
