import { Injectable } from '@nestjs/common';
import { CommentRaw } from '../domain/comment.entity';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-code';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CreateCommentDto } from '../dto/create-comment.dto';
import { UpdateCommentDto } from '../dto/update-comment.dto';

@Injectable()
export class CommentsRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async createComment(comment: CreateCommentDto): Promise<number> {
    const [{ id }] = await this.dataSource.query<[{ id: number }]>(
      `
    INSERT INTO comments (content, post_id, user_id)
    VALUES ($1, $2, $3)
    RETURNING id
    `,
      [comment.content, comment.postId, comment.userId],
    );

    return id;
  }

  async updateComment(id: number, comment: UpdateCommentDto): Promise<boolean> {
    const [, updatedCount] = await this.dataSource.query<[void, number]>(
      `
    UPDATE comments
    SET content = $2
    WHERE id = $1 and deleted_at is NULL
    `,
      [id, comment.content],
    );

    return updatedCount > 0;
  }

  async deleteComment(id: number): Promise<boolean> {
    const [, deletedCount] = await this.dataSource.query<[void, number]>(
      `
    UPDATE comments
    SET deleted_at = $2
    WHERE id = $1 and deleted_at is NULL
    `,
      [id, new Date()],
    );

    return deletedCount > 0;
  }

  async findById(id: number): Promise<CommentRaw | null> {
    const [comment = null] = await this.dataSource.query<CommentRaw[]>(
      `SELECT * 
      FROM comments 
      WHERE id = $1 AND deleted_at is null`,
      [id],
    );

    return comment;
  }

  async findByIdOrNotFound(id: number): Promise<CommentRaw> {
    const comment = await this.findById(id);

    if (!comment) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Comment not found',
      });
    }

    return comment;
  }
}
