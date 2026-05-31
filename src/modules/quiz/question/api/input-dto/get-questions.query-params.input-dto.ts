import { BaseQueryParamsInputDto } from '../../../../../core/api/input-dto/base.query-params.input-dto';
import { QuestionSortBy } from './question.sort-by';
import { IsEnum, IsOptional } from 'class-validator';
import { IsStringLengthTrim } from '../../../../../core/decorators/validation/is-string-length-trim';
import { QuestionPublishedStatus } from './question.published-status';

export class GetQuestionsQueryParamsInputDto extends BaseQueryParamsInputDto {
  @IsEnum(QuestionSortBy)
  sortBy: QuestionSortBy = QuestionSortBy.CreatedAt;

  @IsStringLengthTrim()
  @IsOptional()
  bodySearchTerm: string | null = null;

  @IsEnum(QuestionPublishedStatus)
  publishedStatus: QuestionPublishedStatus = QuestionPublishedStatus.All;
}
