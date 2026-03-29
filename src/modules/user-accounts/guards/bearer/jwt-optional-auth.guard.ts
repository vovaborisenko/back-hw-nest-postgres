import { AuthGuard } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtOptionalAuthGuard extends AuthGuard('jwt') {
  handleRequest(_err: any, user: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return user || null;
  }
}
