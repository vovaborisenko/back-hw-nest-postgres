import { Inject, Injectable } from '@nestjs/common';
import { UsersRepository } from '../infrastructure/users.repository';
import { BcryptService } from './bcrypt.service';
import { JwtService } from '@nestjs/jwt';
import { UserContextDto } from '../guards/dto/user-context.dto';
import { EmailService } from '../../notifications/email.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UsersService } from './users.service';
import { RegistrationConfirmationDto } from '../dto/registration-confirmation.dto';
import { DomainException } from '../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-code';
import { RegistrationEmailResendingDto } from '../dto/registration-email-resending.dto';
import { INJECT_TOKEN } from '../constants/inject-token';
import { CreateRefreshTokenDto } from '../dto/create-refresh-token.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly usersRepository: UsersRepository,
    @Inject(INJECT_TOKEN.ACCESS)
    private readonly accessTokenContext: JwtService,
    @Inject(INJECT_TOKEN.REFRESH)
    private readonly refreshTokenContext: JwtService,
    private readonly bcryptService: BcryptService,
    private readonly emailService: EmailService,
  ) {}

  async generateTokens(
    userId: string,
    deviceId: string = crypto.randomUUID(),
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = await this.accessTokenContext.signAsync({ id: userId });
    const refreshToken =
      await this.refreshTokenContext.signAsync<CreateRefreshTokenDto>({
        id: userId,
        deviceId,
      });

    return { accessToken, refreshToken };
  }

  async checkCredentials(
    loginOrEmail: string,
    password: string,
  ): Promise<UserContextDto | null> {
    const user = await this.usersRepository.findByLoginOrEmail(loginOrEmail);

    if (!user) {
      return null;
    }

    const isPasswordCorrect = await this.bcryptService.compare(
      password,
      user.passwordHash,
    );

    if (!isPasswordCorrect) {
      return null;
    }

    return { id: user._id.toString() };
  }

  async registration(dto: CreateUserDto): Promise<void> {
    const user = await this.usersService.createUser(dto);

    this.emailService
      .sendConfirmationEmail(
        user.email,
        user.emailConfirmation.confirmationCode,
      )
      .catch((error) => console.warn(error));
  }

  async resendConfirmationCode(
    dto: RegistrationEmailResendingDto,
  ): Promise<void> {
    const user = await this.usersRepository.findByEmail(dto.email);

    try {
      user!.updateEmailConfirmation();
    } catch {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'Invalid email',
        extensions: [{ field: 'email', message: 'Email is not valid' }],
      });
    }

    await this.usersRepository.save(user!);

    this.emailService
      .sendConfirmationEmail(
        user!.email,
        user!.emailConfirmation.confirmationCode,
      )
      .catch((error) => console.warn(error));
  }

  async confirmCode(dto: RegistrationConfirmationDto): Promise<void> {
    const user = await this.usersRepository.findByEmailConfirmationCode(
      dto.code,
    );

    try {
      user!.confirm();
    } catch {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'Invalid code',
        extensions: [{ field: 'code', message: 'Code is not valid' }],
      });
    }

    await this.usersRepository.save(user!);
  }
  //
  // async regenerateTokens({
  //   deviceId,
  //   userId,
  //   issuedAt,
  // }: RefreshTokenUpdateDto): Promise<
  //   Result<{ accessToken: string; refreshToken: string }>
  // > {
  //   const { data } = await this.jwtService.generateTokens(userId, deviceId);
  //   const refreshTokenPayload = this.jwtService.decodeRefreshToken(
  //     data.refreshToken,
  //   );
  //
  //   await this.securityDevicesService.update(
  //     { deviceId, issuedAt },
  //     {
  //       refreshToken: refreshTokenPayload,
  //     },
  //   );
  //
  //   return {
  //     status: ResultStatus.Success,
  //     extensions: [],
  //     data,
  //   };
  // }
}
