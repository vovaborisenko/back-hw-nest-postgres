import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { Injectable } from '@nestjs/common';
import { AuthService } from '../../application/auth.service';
import { UserContextDto } from '../dto/user-context.dto';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      usernameField: 'loginOrEmail',
      passwordField: 'password',
    });
  }

  validate(
    loginOrEmail: string,
    password: string,
  ): Promise<UserContextDto | null> {
    return this.authService.checkCredentials(loginOrEmail, password);
  }
}
