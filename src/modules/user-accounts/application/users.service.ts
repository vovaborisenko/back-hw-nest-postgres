import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../infrastructure/users.repository';
import type { CreateUserDto } from '../dto/create-user.dto';
import { BcryptService } from './bcrypt.service';
import { DomainException } from '../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-code';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly bcryptService: BcryptService,
  ) {}

  async createUser(dto: CreateUserDto): Promise<{
    id: number;
    confirmationCode: string;
  }> {
    const userByEmail = await this.usersRepository.findByEmail(dto.email);

    if (userByEmail) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'Email already exists',
        extensions: [{ field: 'email', message: 'Email should be uniq' }],
      });
    }

    const userByLogin = await this.usersRepository.findByLogin(dto.login);

    if (userByLogin) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'Login already exists',
        extensions: [{ field: 'login', message: 'Login should be uniq' }],
      });
    }

    const passwordHash = await this.bcryptService.createHash(dto.password);

    return this.usersRepository.createUser({
      email: dto.email,
      login: dto.login,
      passwordHash,
    });
  }

  async deleteUser(id: number): Promise<void> {
    const user = await this.usersRepository.deleteUser(id);

    if (!user) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'User not found',
      });
    }
  }
}
