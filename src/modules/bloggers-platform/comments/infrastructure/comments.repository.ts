import { Injectable } from '@nestjs/common';
import { Comment } from '../domain/comment.entity';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-code';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { CreateCommentDto } from '../dto/create-comment.dto';
import { UpdateCommentDto } from '../dto/update-comment.dto';

@Injectable()
export class CommentsRepository {
  constructor(
    @InjectRepository(Comment)
    private readonly commentsRepo: Repository<Comment>,
  ) {}

  async createComment(dto: CreateCommentDto): Promise<number> {
    const comment = Comment.create(dto);

    await this.commentsRepo.save(comment);

    return comment.id;
  }

  async updateComment(id: number, dto: UpdateCommentDto): Promise<void> {
    const comment = await this.findByIdOrNotFound(id);

    comment.content = dto.content;

    await this.commentsRepo.save(comment);
  }

  async deleteComment(id: number): Promise<boolean> {
    const { affected = 0 } = await this.commentsRepo.softDelete({
      id,
      deletedAt: IsNull(),
    });

    return affected > 0;
  }

  findById(id: number): Promise<Comment | null> {
    return this.commentsRepo.findOne({
      where: { id },
      relations: { author: true },
    });
  }

  async findByIdOrNotFound(id: number): Promise<Comment> {
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
