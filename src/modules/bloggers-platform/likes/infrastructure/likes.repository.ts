import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { SetLikeDto } from '../dto/set-like.dto';
import { LikeStatus } from '../enums/like-status';
import { LikeRaw } from '../domain/like.entity';
import { LikeParent } from '../enums/like-parent';

@Injectable()
export class LikesRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async createLike(like: SetLikeDto): Promise<number> {
    const [{ id }] = await this.dataSource.query<[{ id: number }]>(
      `
    INSERT INTO likes (status, user_id, parent_id, parent_entity)
    VALUES ($1, $2, $3, $4)
    RETURNING id
    `,
      [like.status, like.userId, like.parentId, like.parentEntity],
    );

    return id;
  }

  async updateLike(id: number, status: LikeStatus): Promise<boolean> {
    const [, updatedCount] = await this.dataSource.query<[void, number]>(
      `
    UPDATE likes
    SET status = $2
    WHERE id = $1
    `,
      [id, status],
    );

    return updatedCount > 0;
  }

  async findUserLike({
    userId,
    parentId,
    parentEntity,
  }: {
    userId: number;
    parentId: number;
    parentEntity: LikeParent;
  }): Promise<LikeRaw | null> {
    const [like = null] = await this.dataSource.query<LikeRaw[]>(
      `SELECT * 
      FROM likes 
      WHERE user_id = $1 AND parent_id = $2 AND parent_entity = $3`,
      [userId, parentId, parentEntity],
    );

    return like;
  }
}
