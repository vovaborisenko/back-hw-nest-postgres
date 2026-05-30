import { LikeStatus } from '../enums/like-status';
import { User } from '../../../user-accounts/domain/user.entity';
import { CreateLikeDomainDto } from './dto/create-like.domain-dto';
import { LikeParent } from '../enums/like-parent';
import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseDbEntity } from '../../../../core/domain/baseDbEntity';

@Entity()
export class Like extends BaseDbEntity {
  @Column({ type: 'enum', enum: LikeStatus })
  status: LikeStatus;

  @ManyToOne(() => User)
  author: User;

  @Column()
  authorId: number;

  @Column()
  parentId: number;

  @Column({ type: 'enum', enum: LikeParent })
  parentType: LikeParent;

  static create(dto: CreateLikeDomainDto) {
    const like = new this();

    like.status = dto.status;
    like.author = { id: dto.userId } as User;
    like.parentId = dto.parentId;
    like.parentType = dto.parentType;

    return like;
  }
}
