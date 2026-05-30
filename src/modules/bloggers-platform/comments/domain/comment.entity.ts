import { Post } from '../../posts/domain/post.entity';
import { User } from '../../../user-accounts/domain/user.entity';
import { CreateCommentDomainDto } from './dto/create-comment.domain-dto';
import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseDbEntity } from '../../../../core/domain/baseDbEntity';

@Entity()
export class Comment extends BaseDbEntity {
  @Column()
  content: string;

  @ManyToOne(() => Post, (post) => post.comments, { nullable: false })
  post: Post;

  @ManyToOne(() => User, (user) => user.comments, { nullable: false })
  author: User;

  static create(dto: CreateCommentDomainDto) {
    const comment = new this();

    comment.content = dto.content;
    comment.post = { id: dto.postId } as Post;
    comment.author = { id: dto.userId } as User;

    return comment;
  }
}
