import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PATH } from '../../../../../core/constants/paths';
import { BasicAuthGuard } from '../../../../user-accounts/guards/basic/basic-auth.guard';
import { GetQuestionsQueryParamsInputDto } from '../input-dto/get-questions.query-params.input-dto';
import { BasePathParamsInputDto } from '../../../../../core/api/input-dto/base.path-params.input-dto';
import { CreateQuestionInputDto } from '../input-dto/create-question.input-dto';
import { UpdateQuestionInputDto } from '../input-dto/update-question.input-dto';
import { UpdateQuestionStatusInputDto } from '../input-dto/update-question-status.input-dto';
import { BasePaginatedViewDto } from '../../../../../core/api/view-dto/base.paginated.view-dto';
import { QuestionViewDto } from '../view-dto/question.view-dto';
import { QuestionQueryRepository } from '../../infrastructure/question.query-repository';
import { CommandBus } from '@nestjs/cqrs';
import { CreateQuestionCommand } from '../../application/usecases/create-question.use-case';
import { DeleteQuestionCommand } from '../../application/usecases/delete-question.use-case';
import { UpdateQuestionCommand } from '../../application/usecases/update-question.use-case';
import { UpdateQuestionStatusCommand } from '../../application/usecases/update-question-status.use-case';

const { SA_PREFIX, SINGLE, SINGLE_PUBLISH } = PATH.QUESTIONS;

@UseGuards(BasicAuthGuard)
@Controller(SA_PREFIX)
export class QuestionController {
  constructor(
    protected readonly questionQueryRepository: QuestionQueryRepository,
    private readonly commandBus: CommandBus,
  ) {}

  @Get()
  getAll(
    @Query() query: GetQuestionsQueryParamsInputDto,
  ): Promise<BasePaginatedViewDto<QuestionViewDto[]>> {
    return this.questionQueryRepository.getAll(query);
  }

  @Post()
  async create(@Body() dto: CreateQuestionInputDto): Promise<QuestionViewDto> {
    const id = await this.commandBus.execute(new CreateQuestionCommand(dto));

    return this.questionQueryRepository.getByIdOrNotFoundFail(id);
  }

  @Delete(SINGLE)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param() params: BasePathParamsInputDto) {
    await this.commandBus.execute(new DeleteQuestionCommand(params.id));
  }

  @Put(SINGLE)
  @HttpCode(HttpStatus.NO_CONTENT)
  async update(
    @Param() params: BasePathParamsInputDto,
    @Body() dto: UpdateQuestionInputDto,
  ) {
    await this.commandBus.execute(new UpdateQuestionCommand(params.id, dto));
  }

  @Put(SINGLE_PUBLISH)
  @HttpCode(HttpStatus.NO_CONTENT)
  async publish(
    @Param() params: BasePathParamsInputDto,
    @Body() dto: UpdateQuestionStatusInputDto,
  ) {
    await this.commandBus.execute(
      new UpdateQuestionStatusCommand(params.id, dto),
    );
  }
}
