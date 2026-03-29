import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../infrastructure/users.repository';
import { PasswordRecoveryDto } from '../dto/password-recovery.dto';
import { EmailService } from '../../notifications/email.service';
import { PasswordUpdateDto } from '../dto/password-update.dto';
import { BcryptService } from './bcrypt.service';
import { DomainException } from '../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-code';

@Injectable()
export class PasswordService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly emailService: EmailService,
    private readonly bcryptService: BcryptService,
  ) {}

  async changePasswordByRecoveryCode({
    newPassword,
    recoveryCode,
  }: PasswordUpdateDto): Promise<void> {
    const passwordHash = await this.bcryptService.createHash(newPassword);
    const isSuccessUpdated = await this.usersRepository.updatePasswordHash(
      recoveryCode,
      passwordHash,
    );

    if (!isSuccessUpdated) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'Invalid code',
        extensions: [{ field: 'code', message: 'code is not valid' }],
      });
    }
  }

  async sendRecoveryCode({ email }: PasswordRecoveryDto): Promise<void> {
    const user = await this.usersRepository.findByEmail(email);

    if (!user) {
      return;
    }

    const recoveryCode = await this.usersRepository.createRecovery(user.id);

    if (recoveryCode) {
      this.emailService
        .sendPasswordRecovery(email, recoveryCode)
        .catch((error) => console.warn(error));
    }
  }
}
