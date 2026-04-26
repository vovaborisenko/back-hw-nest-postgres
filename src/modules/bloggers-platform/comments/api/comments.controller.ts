import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import { PATH } from '../../../../core/constants/paths';
import { JwtAuthGuard } from '../../../user-accounts/guards/bearer/jwt-auth.guard';
import { ExtractUserFromRequestDecorator } from '../../../user-accounts/guards/decorators/param/extract-user-from-request.decorator';
import { UserContextDto } from '../../../user-accounts/guards/dto/user-context.dto';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { GetCommentByIdQuery } from '../application/queries/get-comment-by-id.query';
import { CommentViewDto } from './view-dto/comment.view-dto';
import { UpdateCommentInputDto } from './input-dto/update-comment.input-dto';
import { UpdateCommentCommand } from '../application/usecases/update-comment.usecase';
import { DeleteCommentCommand } from '../application/usecases/delete-comment.usecase';
import { LikeInputDto } from '../../likes/api/input-dto/like.input-dto';
import { SetCommentLikeCommand } from '../application/usecases/set-comment-like.usecase';
import { JwtOptionalAuthGuard } from '../../../user-accounts/guards/bearer/jwt-optional-auth.guard';
import { ExtractUserIfExistsFromRequestDecorator } from '../../../user-accounts/guards/decorators/param/extract-user-if-exists-from-request.decorator';
import { BasePathParamsInputDto } from '../../../../core/api/input-dto/base.path-params.input-dto';

const { PREFIX, SINGLE, LIKE_STATUS } = PATH.COMMENTS;

@Controller(PREFIX)
export class CommentsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @UseGuards(JwtOptionalAuthGuard)
  @Get(SINGLE)
  async getById(
    @Param() params: BasePathParamsInputDto,
    @ExtractUserIfExistsFromRequestDecorator() user: UserContextDto | null,
  ): Promise<CommentViewDto> {
    return this.queryBus.execute(new GetCommentByIdQuery(params.id, user?.id));
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Put(SINGLE)
  async update(
    @Param() params: BasePathParamsInputDto,
    @Body() dto: UpdateCommentInputDto,
    @ExtractUserFromRequestDecorator() user: UserContextDto,
  ): Promise<void> {
    await this.commandBus.execute(
      new UpdateCommentCommand(dto, params.id, user.id),
    );
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(SINGLE)
  async remove(
    @Param() params: BasePathParamsInputDto,
    @ExtractUserFromRequestDecorator() user: UserContextDto,
  ): Promise<void> {
    await this.commandBus.execute(new DeleteCommentCommand(params.id, user.id));
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Put(LIKE_STATUS)
  async updateLikeStatus(
    @ExtractUserFromRequestDecorator() user: UserContextDto,
    @Param() params: BasePathParamsInputDto,
    @Body() dto: LikeInputDto,
  ): Promise<void> {
    await this.commandBus.execute(
      new SetCommentLikeCommand({
        status: dto.likeStatus,
        userId: user.id,
        parentId: params.id,
      }),
    );
  }
}
