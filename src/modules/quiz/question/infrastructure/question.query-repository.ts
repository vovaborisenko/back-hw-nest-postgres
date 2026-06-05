import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Question } from '../domain/question.entity';
import { FindOptionsOrder, FindOptionsWhere, ILike, Repository } from 'typeorm';
import { GetQuestionsQueryParamsInputDto } from '../api/input-dto/get-questions.query-params.input-dto';
import { BasePaginatedViewDto } from '../../../../core/api/view-dto/base.paginated.view-dto';
import { QuestionViewDto } from '../api/view-dto/question.view-dto';
import { QuestionPublishedStatus } from '../api/input-dto/question.published-status';
import { QuestionStatus } from '../enums/question-status';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-code';
import { QuestionSortBy } from '../api/input-dto/question.sort-by';

@Injectable()
export class QuestionQueryRepository {
  constructor(
    @InjectRepository(Question)
    private readonly questionRepo: Repository<Question>,
  ) {}

  async getAll(
    query: GetQuestionsQueryParamsInputDto,
  ): Promise<BasePaginatedViewDto<QuestionViewDto[]>> {
    const where: FindOptionsWhere<Question> = {};
    const order: FindOptionsOrder<Question> = {};

    if (query.publishedStatus === QuestionPublishedStatus.Published) {
      where.status = QuestionStatus.Published;
    }

    if (query.publishedStatus === QuestionPublishedStatus.Unpublished) {
      where.status = QuestionStatus.Draft;
    }

    if (query.bodySearchTerm) {
      where.content = ILike(`%${query.bodySearchTerm}%`);
    }

    if (query.sortBy) {
      order[this.getSortBy(query.sortBy)] = query.sortDirection;
    }

    const [items, count] = await this.questionRepo.findAndCount({
      where,
      skip: query.skip,
      take: query.pageSize,
      order: {
        ...order,
        id: query.sortDirection,
      },
    });

    return BasePaginatedViewDto.mapToView({
      page: query.pageNumber,
      size: query.pageSize,
      totalCount: count,
      items: items.map((item) => QuestionViewDto.mapToView(item)),
    });
  }

  protected findById(id: number): Promise<Question | null> {
    return this.questionRepo.findOneBy({ id });
  }

  async getByIdOrNotFoundFail(id: number): Promise<QuestionViewDto> {
    const question = await this.findById(id);

    if (!question) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Question not found',
      });
    }

    return QuestionViewDto.mapToView(question);
  }

  protected getSortBy(sortBy: QuestionSortBy) {
    if (sortBy === QuestionSortBy.Published) {
      return 'status';
    }

    if (sortBy === QuestionSortBy.Body) {
      return 'content';
    }

    return sortBy;
  }
}
