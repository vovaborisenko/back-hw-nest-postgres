import { Injectable } from '@nestjs/common';
import { UserRaw } from '../domain/user.entity';
import { UserViewDto } from '../api/view-dto/users.view-dto';
import { GetUsersQueryParamsInputDto } from '../api/input-dto/get-users.query-params.input-dto';
import { BasePaginatedViewDto } from '../../../core/api/view-dto/base.paginated.view-dto';
import { DomainException } from '../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-code';
import { MeViewDto } from '../api/view-dto/me.view-dto';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class UsersQueryRepository {
  constructor(@InjectDataSource() private readonly datasource: DataSource) {}

  async findById(id: number): Promise<UserRaw | null> {
    const [user = null] = await this.datasource.query<UserRaw[]>(
      `SELECT * 
      FROM users 
      WHERE id = $1 AND deleted_at is null`,
      [id],
    );

    return user;
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
    const loginFilter = query.searchLoginTerm
      ? `login ILIKE '%' || '${query.searchLoginTerm}' || '%'`
      : '';
    const emailFilter = query.searchEmailTerm
      ? `email ILIKE '%' || '${query.searchEmailTerm}' || '%'`
      : '';
    const orFilter = [loginFilter, emailFilter].filter(Boolean).join(' OR ');
    const orFilterInBrackets = orFilter ? `( ${orFilter} )` : '';
    const andFilter = [orFilterInBrackets, 'deleted_at is NULL']
      .filter(Boolean)
      .join(' AND ');
    const sortField = query.sortBy.replace(/([A-Z])/g, '_$1');
    const sortByQuery = query.sortBy
      ? `${sortField} ${query.sortDirection}`
      : '';
    const sortByDefault = `id ${query.sortDirection}`;
    const orderBy = [sortByQuery, sortByDefault].filter(Boolean).join(', ');

    const dataQuery = this.datasource.query<UserRaw[]>(
      `
      SELECT * 
      FROM users 
      WHERE ${andFilter} 
      ORDER BY ${orderBy} 
      LIMIT $1 
      OFFSET $2    `,
      [query.pageSize, query.skip],
    );
    const countQuery = this.datasource.query<{ count: string }[]>(
      `
      SELECT COUNT(*) 
      FROM users 
      WHERE ${andFilter}
    `,
    );

    const [items, [{ count }]] = await Promise.all([dataQuery, countQuery]);

    return BasePaginatedViewDto.mapToView({
      page: query.pageNumber,
      size: query.pageSize,
      totalCount: Number(count),
      items: items.map((item) => UserViewDto.mapToView(item)),
    });
  }
}
