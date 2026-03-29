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
    const user = await this.usersRepository.findByRecoveryCode(recoveryCode);

    if (!user) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'Invalid code',
        extensions: [{ field: 'code', message: 'code is not valid' }],
      });
    }

    user.passwordHash = await this.bcryptService.createHash(newPassword);
    user.recovery = null;

    await this.usersRepository.save(user);
  }

  async sendRecoveryCode({ email }: PasswordRecoveryDto): Promise<void> {
    const user = await this.usersRepository.findByEmail(email);

    if (!user) {
      return;
    }

    user.createRecovery();

    await this.usersRepository.save(user);

    if (user.recovery?.code) {
      this.emailService
        .sendPasswordRecovery(email, user.recovery.code)
        .catch((error) => console.warn(error));
    }
  }
}
