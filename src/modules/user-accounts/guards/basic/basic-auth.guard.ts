import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-code';

@Injectable()
export class BasicAuthGuard extends AuthGuard('basic') {
  handleRequest(err: any, user: any) {
    if (err || !user) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'Basic authentication failed',
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return user;
  }
}
