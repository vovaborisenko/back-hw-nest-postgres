import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from '../application/users.service';
import { CreateUserInputDto } from './input-dto/users.input-dto';
import { UsersQueryRepository } from '../infrastructure/users.query-repository';
import type { UserViewDto } from './view-dto/users.view-dto';
import { GetUsersQueryParamsInputDto } from './input-dto/get-users.query-params.input-dto';
import { BasePaginatedViewDto } from '../../../core/api/view-dto/base.paginated.view-dto';
import { BasePathParamsInputDto } from '../../../core/api/input-dto/base.path-params.input-dto';
import { BasicAuthGuard } from '../guards/basic/basic-auth.guard';
import { PARAM, PATH } from '../../../core/constants/paths';

const { PREFIX, SINGLE } = PATH.USERS;

@UseGuards(BasicAuthGuard)
@Controller(PREFIX)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly usersQueryRepository: UsersQueryRepository,
  ) {}

  @Get()
  getAll(
    @Query()
    query: GetUsersQueryParamsInputDto,
  ): Promise<BasePaginatedViewDto<UserViewDto[]>> {
    return this.usersQueryRepository.getAll(query);
  }

  @Post()
  async createUser(@Body() body: CreateUserInputDto): Promise<UserViewDto> {
    const user = await this.usersService.createUser(body);

    return this.usersQueryRepository.getByIdOrNotFountFail(user._id);
  }

  @Delete(SINGLE)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(@Param() params: BasePathParamsInputDto) {
    await this.usersService.deleteUser(params[PARAM.ID]);
  }
}
