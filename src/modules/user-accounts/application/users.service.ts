import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { UserDocument, UserModelType } from '../domain/user.entity';
import { User } from '../domain/user.entity';
import { UsersRepository } from '../infrastructure/users.repository';
import type { CreateUserDto } from '../dto/create-user.dto';
import { BcryptService } from './bcrypt.service';
import { Types } from 'mongoose';
import { DomainException } from '../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-code';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly UserModel: UserModelType,
    private readonly usersRepository: UsersRepository,
    private readonly bcryptService: BcryptService,
  ) {}

  async createUser(dto: CreateUserDto): Promise<UserDocument> {
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

    const user = this.UserModel.createInstance({
      email: dto.email,
      login: dto.login,
      passwordHash,
    });

    await this.usersRepository.save(user);

    return user;
  }

  async deleteUser(id: string | Types.ObjectId): Promise<void> {
    const user = await this.usersRepository.findByIdOrNotFountFail(id);

    user.makeDeleted();

    await this.usersRepository.save(user);
  }
}
