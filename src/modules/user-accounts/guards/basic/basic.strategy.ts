import { PassportStrategy } from '@nestjs/passport';
import { BasicStrategy as Strategy } from 'passport-http';
import { Injectable } from '@nestjs/common';
import { UserAccountsConfig } from '../../config/user-accounts.config';

@Injectable()
export class BasicStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly userAccountsConfig: UserAccountsConfig) {
    super();
  }

  validate(username: string, password: string): boolean {
    return (
      username === this.userAccountsConfig.adminName &&
      password === this.userAccountsConfig.adminPassword
    );
  }
}
