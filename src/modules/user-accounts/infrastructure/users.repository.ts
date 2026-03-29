import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Types } from 'mongoose';
import { User } from '../domain/user.entity';
import type { UserDocument, UserModelType } from '../domain/user.entity';
import { DomainException } from '../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-code';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectModel(User.name) private readonly UserModel: UserModelType,
  ) {}

  async save(user: UserDocument): Promise<void> {
    await user.save();
  }

  findById(id: string | Types.ObjectId): Promise<UserDocument | null> {
    return this.UserModel.findById(id).where({ deletedAt: null });
  }

  async findByIdOrNotFountFail(
    id: string | Types.ObjectId,
  ): Promise<UserDocument> {
    const user = await this.findById(id);

    if (!user) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'User not found',
      });
    }

    return user;
  }

  findByLoginOrEmail(loginOrEmail: string): Promise<UserDocument | null> {
    return this.UserModel.findOne({
      $or: [{ login: loginOrEmail }, { email: loginOrEmail }],
    }).where({ deletedAt: null });
  }

  findByLogin(login: string): Promise<UserDocument | null> {
    return this.UserModel.findOne({ login }).where({ deletedAt: null });
  }

  findByEmail(email: string): Promise<UserDocument | null> {
    return this.UserModel.findOne({ email }).where({ deletedAt: null });
  }

  findByEmailConfirmationCode(code: string): Promise<UserDocument | null> {
    return this.UserModel.findOne({
      'emailConfirmation.confirmationCode': code,
    }).where({ deletedAt: null });
  }

  findByRecoveryCode(code: string): Promise<UserDocument | null> {
    return this.UserModel.findOne({
      'recovery.code': code,
      'recovery.expirationDate': { $gt: new Date() },
    }).where({ deletedAt: null });
  }
}
