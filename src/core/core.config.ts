import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IsBoolean, IsEnum, IsNotEmpty, IsNumber } from 'class-validator';
import { configValidationUtility } from '../setup/config-validation.utility';

export enum Environments {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production',
  TESTING = 'testing',
}

@Injectable()
export class CoreConfig {
  @IsNumber(
    {},
    {
      message: 'Set Env variable PORT, example: 3000',
    },
  )
  port: number;

  @IsNotEmpty({
    message:
      'Set Env variable MONGO_URI, example: mongodb://localhost:27017/my-app-local-db',
  })
  mongoURI: string;

  @IsEnum(Environments, {
    message:
      'Ser correct NODE_ENV value, available values: ' +
      configValidationUtility.getEnumValues(Environments).join(', '),
  })
  env: string;

  @IsBoolean({
    message:
      'Set Env variable INCLUDE_TESTING_MODULE to enable/disable Dangerous for production TestingModule, example: true, available values: true, false, 0, 1',
  })
  includeTestingModule?: boolean;

  @IsBoolean({
    message:
      'Set Env variable SEND_INTERNAL_SERVER_ERROR_DETAILS to enable/disable Dangerous for production internal server error details (message, etc), example: true, available values: true, false, 0, 1',
  })
  sendInternalServerErrorDetails?: boolean;

  @IsNumber(
    {},
    {
      message: 'Set Env variable RATE_LIMIT_PERIOD, example: 1e4',
    },
  )
  rateLimitPeriod: number;

  @IsNumber(
    {},
    {
      message: 'Set Env variable RATE_LIMIT_MAX_ATTEMPTS, example: 5',
    },
  )
  rateLimitMaxAttempts: number;

  constructor(private readonly configService: ConfigService<any, true>) {
    // Инициализация всех свойств в конструкторе
    this.port = Number(this.configService.get('PORT'));
    this.mongoURI = this.configService.get('MONGO_URI');
    this.env = this.configService.get('NODE_ENV');
    this.includeTestingModule = configValidationUtility.convertToBoolean(
      this.configService.get('INCLUDE_TESTING_MODULE'),
    );
    this.sendInternalServerErrorDetails =
      configValidationUtility.convertToBoolean(
        this.configService.get('SEND_INTERNAL_SERVER_ERROR_DETAILS'),
      );
    this.rateLimitPeriod = Number(this.configService.get('RATE_LIMIT_PERIOD'));
    this.rateLimitMaxAttempts = Number(
      this.configService.get('RATE_LIMIT_MAX_ATTEMPTS'),
    );

    // Валидация после инициализации всех свойств
    configValidationUtility.validateConfig(this);
  }
}
