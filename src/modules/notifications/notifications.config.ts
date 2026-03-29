import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { configValidationUtility } from '../../setup/config-validation.utility';
import { IsEmail, IsNotEmpty } from 'class-validator';

@Injectable()
export class NotificationsConfig {
  @IsEmail(
    {},
    {
      message: 'Set Env variable EMAIL',
    },
  )
  email: string;

  @IsNotEmpty({
    message: 'Set Env variable EMAIL_NAME',
  })
  emailName: string;

  @IsNotEmpty({
    message: 'Set Env variable EMAIL_PASSWORD',
  })
  emailPassword: string;

  @IsNotEmpty({
    message: 'Set Env variable EMAIL_TRANSPORT_SERVICE',
  })
  emailTransportService: string;

  constructor(private readonly configService: ConfigService<any, true>) {
    this.email = this.configService.get('EMAIL');
    this.emailName = this.configService.get('EMAIL_NAME');
    this.emailPassword = this.configService.get('EMAIL_PASSWORD');
    this.emailTransportService = this.configService.get(
      'EMAIL_TRANSPORT_SERVICE',
    );

    configValidationUtility.validateConfig(this);
  }
}
