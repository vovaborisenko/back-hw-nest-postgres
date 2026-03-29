import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { LocalAuthGuard } from '../guards/local/local-auth.guard';
import { LoginViewDto } from './view-dto/login.view-dto';
import { AuthService } from '../application/auth.service';
import { ExtractUserFromRequestDecorator } from '../guards/decorators/param/extract-user-from-request.decorator';
import {
  RefreshTokenDto,
  UserContextDto,
} from '../guards/dto/user-context.dto';
import { PATH } from '../../../core/constants/paths';
import { JwtAuthGuard } from '../guards/bearer/jwt-auth.guard';
import { UsersQueryRepository } from '../infrastructure/users.query-repository';
import { MeViewDto } from './view-dto/me.view-dto';
import { PasswordRecoveryInputDto } from './input-dto/password-recovery.input-dto';
import { PasswordService } from '../application/password.service';
import { CreateUserInputDto } from './input-dto/users.input-dto';
import { RegistrationConfirmationInputDto } from './input-dto/registration-confirmation.input-dto';
import { RegistrationEmailResendingInputDto } from './input-dto/registration-email-resending.input-dto';
import { PasswordUpdateInputDto } from './input-dto/password-update.input-dto';
import { ThrottlerGuard } from '@nestjs/throttler';
import { IpAddress } from '../guards/decorators/param/ip-address';
import { UserAgent } from '../guards/decorators/param/user-agent';
import type { Agent } from 'useragent';
import { CommandBus } from '@nestjs/cqrs';
import { CreateSecurityDeviceCommand } from '../security-devices/application/usecases/create-security-device.usecase';
import { JwtRefreshAuthGuard } from '../guards/bearer/jwt-refresh-auth.guard';
import { DeleteSecurityDeviceCommand } from '../security-devices/application/usecases/delete-security-device.usecase';
import { UpdateSecurityDeviceCommand } from '../security-devices/application/usecases/update-security-device.usecase';

const { PREFIX, ...URL } = PATH.AUTH;

@Controller(PREFIX)
export class AuthController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly authService: AuthService,
    private readonly passwordService: PasswordService,
    private readonly usersQueryRepository: UsersQueryRepository,
  ) {}

  @UseGuards(LocalAuthGuard)
  @UseGuards(ThrottlerGuard)
  @HttpCode(HttpStatus.OK)
  @Post(URL.LOGIN)
  async login(
    @IpAddress() ip: string | null,
    @UserAgent() userAgent: Agent,
    @ExtractUserFromRequestDecorator() user: UserContextDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginViewDto> {
    const { accessToken, refreshToken } = await this.authService.generateTokens(
      user.id,
    );
    await this.commandBus.execute(
      new CreateSecurityDeviceCommand({ ip, userAgent, refreshToken }),
    );

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
    });

    return { accessToken };
  }

  @UseGuards(JwtRefreshAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post(URL.REFRESH_TOKEN)
  async refreshToken(
    @ExtractUserFromRequestDecorator() refreshTokenDto: RefreshTokenDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginViewDto> {
    const { accessToken, refreshToken } = await this.authService.generateTokens(
      refreshTokenDto.id,
      refreshTokenDto.deviceId,
    );
    await this.commandBus.execute(
      new UpdateSecurityDeviceCommand({ refreshToken }),
    );

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
    });

    return { accessToken };
  }

  @UseGuards(JwtRefreshAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post(URL.LOGOUT)
  async logout(
    @ExtractUserFromRequestDecorator() refreshTokenDto: RefreshTokenDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.commandBus.execute(
      new DeleteSecurityDeviceCommand({
        userId: refreshTokenDto.id,
        deviceId: refreshTokenDto.deviceId,
      }),
    );
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: true,
    });
  }

  @UseGuards(ThrottlerGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post(URL.NEW_PASSWORD)
  async updatePassword(@Body() body: PasswordUpdateInputDto) {
    await this.passwordService.changePasswordByRecoveryCode(body);
  }

  @UseGuards(ThrottlerGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post(URL.PASSWORD_RECOVERY)
  async passwordRecovery(@Body() body: PasswordRecoveryInputDto) {
    await this.passwordService.sendRecoveryCode(body);
  }

  @UseGuards(ThrottlerGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post(URL.REGISTRATION)
  async registration(@Body() body: CreateUserInputDto) {
    await this.authService.registration(body);
  }

  @UseGuards(ThrottlerGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post(URL.REG_CONFIRMATION)
  async registrationConfirmation(
    @Body() body: RegistrationConfirmationInputDto,
  ) {
    await this.authService.confirmCode(body);
  }

  @UseGuards(ThrottlerGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post(URL.REG_EMAIL_RESENDING)
  async registrationEmailResending(
    @Body() body: RegistrationEmailResendingInputDto,
  ) {
    await this.authService.resendConfirmationCode(body);
  }

  @UseGuards(JwtAuthGuard)
  @Get(URL.ME)
  getMe(
    @ExtractUserFromRequestDecorator() user: UserContextDto,
  ): Promise<MeViewDto> {
    return this.usersQueryRepository.getMeOrFail(user.id);
  }
}
