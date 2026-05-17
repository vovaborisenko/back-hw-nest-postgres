import { Injectable } from '@nestjs/common';
import { DomainException } from '../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-code';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, MoreThan, Repository } from 'typeorm';
import { CreateUserDomainDto } from '../domain/dto/create-user.domain.dto';
import { User } from '../domain/user.entity';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  async createUser(dto: CreateUserDomainDto): Promise<{
    id: number;
    confirmationCode: string;
  }> {
    const user = User.create(dto);

    await this.userRepo.save(user);

    return {
      id: user.id,
      confirmationCode: user.emailConfirmation.confirmationCode,
    };
  }

  async updatePasswordHash(
    recoveryCode: string,
    hash: string,
  ): Promise<boolean> {
    const user = await this.userRepo.findOneOrFail({
      where: {
        recovery: {
          code: recoveryCode,
          expiredAt: MoreThan(new Date()),
        },
      },
      relations: { recovery: true },
    });

    user.passwordHash = hash;
    user.recovery!.deletedAt = new Date();

    await this.userRepo.save(user);

    return true;
  }

  async deleteUser(id: number): Promise<boolean> {
    const { affected = 0 } = await this.userRepo.softDelete({
      id,
      deletedAt: IsNull(),
    });

    return affected > 0;
  }

  findById(id: number): Promise<User | null> {
    return this.userRepo.findOneBy({ id });
  }

  async findByIdOrNotFountFail(id: number): Promise<User> {
    const user = await this.findById(id);

    if (!user) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'User not found',
      });
    }

    return user;
  }

  findByLoginOrEmail(loginOrEmail: string): Promise<User | null> {
    return this.userRepo.findOneBy([
      { login: loginOrEmail },
      { email: loginOrEmail },
    ]);
  }

  findByLogin(login: string): Promise<User | null> {
    return this.userRepo.findOneBy({ login });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({
      where: { email },
      relations: { emailConfirmation: true },
    });
  }

  async findByEmailConfirmationCode(code: string): Promise<User | null> {
    return this.userRepo.findOne({
      where: {
        emailConfirmation: { confirmationCode: code },
      },
      relations: { emailConfirmation: true },
    });
  }

  async updateEmailConfirmationCode(email: string): Promise<string | null> {
    const user = await this.findByEmail(email);

    if (!user) {
      return null;
    }

    user.updateEmailConfirmation();

    await this.userRepo.save(user);

    return user.emailConfirmation.confirmationCode;
  }

  async confirmEmail(code: string): Promise<boolean> {
    const user = await this.findByEmailConfirmationCode(code);

    if (!user) {
      return false;
    }

    user.confirm();

    await this.userRepo.save(user);

    return true;
  }

  async createRecovery(userId: number): Promise<string> {
    const user = await this.findByIdOrNotFountFail(userId);

    user.createRecoveryCode();

    await this.userRepo.save(user);

    return user.recovery!.code;
  }
}
