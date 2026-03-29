import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { QueryFilter, Types } from 'mongoose';
import type { UserDocument, UserModelType } from '../domain/user.entity';
import { User } from '../domain/user.entity';
import { UserViewDto } from '../api/view-dto/users.view-dto';
import { GetUsersQueryParamsInputDto } from '../api/input-dto/get-users.query-params.input-dto';
import { BasePaginatedViewDto } from '../../../core/api/view-dto/base.paginated.view-dto';
import { DomainException } from '../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-code';
import { MeViewDto } from '../api/view-dto/me.view-dto';

@Injectable()
export class UsersQueryRepository {
  constructor(
    @InjectModel(User.name) private readonly UserModel: UserModelType,
  ) {}

  findById(id: string | Types.ObjectId): Promise<UserDocument | null> {
    return this.UserModel.findById(id).where({ deletedAt: null });
  }

  async getMeOrFail(id: string | Types.ObjectId): Promise<MeViewDto> {
    const user = await this.findById(id);

    if (!user) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'User not found',
      });
    }

    return MeViewDto.mapToView(user);
  }

  async getByIdOrNotFountFail(
    id: string | Types.ObjectId,
  ): Promise<UserViewDto> {
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
    const skip = query.skip;
    const sort = {
      [query.sortBy]: query.sortDirection,
      _id: query.sortDirection,
    };
    const filter: QueryFilter<UserDocument> = { deletedAt: null };

    const $or: QueryFilter<UserDocument>['$or'] = [];
    if (query.searchLoginTerm) {
      $or.push({
        login: { $regex: query.searchLoginTerm, $options: 'i' },
      });
    }
    if (query.searchEmailTerm) {
      $or.push({
        email: { $regex: query.searchEmailTerm, $options: 'i' },
      });
    }
    if ($or.length) {
      filter.$or = $or;
    }

    const [items, totalCount] = await Promise.all([
      this.UserModel.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(query.pageSize)
        .lean(),
      this.UserModel.countDocuments(filter),
    ]);

    return BasePaginatedViewDto.mapToView({
      page: query.pageNumber,
      size: query.pageSize,
      totalCount,
      items: items.map((item) => UserViewDto.mapToView(item)),
    });
  }
}
