import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Question } from '../domain/question.entity';
import { IsNull, Repository } from 'typeorm';
import { CreateQuestionDto } from '../dto/create-question.dto';
import { UpdateQuestionDto } from '../dto/update-question.dto';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-code';
import { UpdateQuestionStatusDto } from '../dto/update-question-status.dto';
import { QuestionStatus } from '../enums/question-status';

@Injectable()
export class QuestionRepository {
  constructor(
    @InjectRepository(Question)
    protected readonly questionRepo: Repository<Question>,
  ) {}

  save(question: Question): Promise<Question> {
    return this.questionRepo.save(question);
  }

  async create(dto: CreateQuestionDto): Promise<number> {
    const question = Question.create(dto);

    await this.save(question);

    return question.id;
  }

  async update(id: number, dto: UpdateQuestionDto): Promise<void> {
    const question = await this.findByIdOrNotFound(id);

    question.content = dto.body;
    question.answers = dto.correctAnswers;

    await this.save(question);
  }

  async updateStatus(id: number, dto: UpdateQuestionStatusDto): Promise<void> {
    const question = await this.findByIdOrNotFound(id);

    question.status = dto.published
      ? QuestionStatus.Published
      : QuestionStatus.Draft;

    await this.save(question);
  }

  async delete(id: number): Promise<boolean> {
    const { affected = 0 } = await this.questionRepo.softDelete({
      id,
      deletedAt: IsNull(),
    });

    return affected > 0;
  }

  findById(id: number): Promise<Question | null> {
    return this.questionRepo.findOneBy({ id });
  }

  async findByIdOrNotFound(id: number): Promise<Question> {
    const question = await this.findById(id);

    if (!question) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Question not found',
      });
    }

    return question;
  }
}
