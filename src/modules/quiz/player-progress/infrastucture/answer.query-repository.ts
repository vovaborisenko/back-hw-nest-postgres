import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Answer } from '../domain/answer.entity';
import { Repository } from 'typeorm';
import { AnswerViewDto } from '../api/view-dto/answer.view-dto';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-code';

@Injectable()
export class AnswerQueryRepository {
  constructor(
    @InjectRepository(Answer) protected readonly answerRepo: Repository<Answer>,
  ) {}

  async findById(id: number): Promise<AnswerViewDto | null> {
    const answer = await this.answerRepo.findOne({ where: { id } });

    return answer ? AnswerViewDto.mapToView(answer) : null;
  }

  async findByIdOrNotFoundFail(id: number): Promise<AnswerViewDto> {
    const answer = await this.findById(id);

    if (!answer) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Answer not found',
      });
    }

    return answer;
  }
}
