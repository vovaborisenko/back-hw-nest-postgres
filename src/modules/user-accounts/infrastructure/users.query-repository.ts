import { Injectable } from '@nestjs/common';
import { User } from '../domain/user.entity';
import { UserViewDto } from '../api/view-dto/users.view-dto';
import { GetUsersQueryParamsInputDto } from '../api/input-dto/get-users.query-params.input-dto';
import { BasePaginatedViewDto } from '../../../core/api/view-dto/base.paginated.view-dto';
import { DomainException } from '../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-code';
import { MeViewDto } from '../api/view-dto/me.view-dto';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsOrder, FindOptionsWhere, ILike, Repository } from 'typeorm';

@Injectable()
export class UsersQueryRepository {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  findById(id: number): Promise<User | null> {
    return this.userRepo.findOneBy({ id });
  }

  async getMeOrFail(id: number): Promise<MeViewDto> {
    const user = await this.findById(id);

    if (!user) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'User not found',
      });
    }

    return MeViewDto.mapToView(user);
  }

  async getByIdOrNotFountFail(id: number): Promise<UserViewDto> {
    const user = await this.findById(id);

    if (!user) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'User not found',
      });
    }

    return UserViewDto.mapToView(user);
  }

  async getAll(
    query: GetUsersQueryParamsInputDto,
  ): Promise<BasePaginatedViewDto<UserViewDto[]>> {
    const where: FindOptionsWhere<User>[] = [];
    const order: FindOptionsOrder<User> = {};

    if (query.searchLoginTerm) {
      where.push({ login: ILike(`%${query.searchLoginTerm}%`) });
    }

    if (query.searchEmailTerm) {
      where.push({ email: ILike(`%${query.searchEmailTerm}%`) });
    }

    if (query.sortBy) {
      order[query.sortBy] = query.sortDirection;
    }

    const [items, count] = await this.userRepo.findAndCount({
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
      totalCount: Number(count),
      items: items.map((item) => UserViewDto.mapToView(item)),
    });
  }
}
