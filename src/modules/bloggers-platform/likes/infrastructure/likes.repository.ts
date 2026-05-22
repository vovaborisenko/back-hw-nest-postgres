import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Like } from '../domain/like.entity';
import { LikeParent } from '../enums/like-parent';

@Injectable()
export class LikesRepository {
  constructor(
    @InjectRepository(Like) private readonly likeRepo: Repository<Like>,
  ) {}

  save(like: Like) {
    return this.likeRepo.save(like);
  }

  async findUserLike({
    userId,
    parentId,
    parentType,
  }: {
    userId: number;
    parentId: number;
    parentType: LikeParent;
  }): Promise<Like | null> {
    return this.likeRepo.findOneBy({
      author: { id: userId },
      parentId,
      parentType,
    });
  }
}
