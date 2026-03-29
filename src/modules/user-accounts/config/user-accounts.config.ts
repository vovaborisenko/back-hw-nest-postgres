import { ConfigService } from '@nestjs/config';
import { configValidationUtility } from '../../../setup/config-validation.utility';
import { IsNotEmpty } from 'class-validator';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UserAccountsConfig {
  @IsNotEmpty({
    message: 'Set Env variable ACCESS_TOKEN_SECRET',
  })
  accessTokenSecret: string;

  @IsNotEmpty({
    message: 'Set Env variable ACCESS_TOKEN_EXPIRE_IN',
  })
  accessTokenExpireIn: string;

  @IsNotEmpty({
    message: 'Set Env variable REFRESH_TOKEN_SECRET',
  })
  refreshTokenSecret: string;

  @IsNotEmpty({
    message: 'Set Env variable REFRESH_TOKEN_EXPIRE_IN',
  })
  refreshTokenExpireIn: string;

  @IsNotEmpty({
    message: 'Set Env variable ADMIN_USERNAME',
  })
  adminName: string;

  @IsNotEmpty({
    message: 'Set Env variable ADMIN_PASSWORD',
  })
  adminPassword: string;

  constructor(private readonly configService: ConfigService<any, true>) {
    this.accessTokenSecret = configService.get('ACCESS_TOKEN_SECRET');
    this.accessTokenExpireIn = configService.get('ACCESS_TOKEN_EXPIRE_IN');
    this.refreshTokenSecret = configService.get('REFRESH_TOKEN_SECRET');
    this.refreshTokenExpireIn = configService.get('REFRESH_TOKEN_EXPIRE_IN');
    this.adminName = configService.get('ADMIN_USERNAME');
    this.adminPassword = configService.get('ADMIN_PASSWORD');

    configValidationUtility.validateConfig(this);
  }
}
