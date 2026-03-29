import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { Request } from 'express';
import { RefreshTokenDto } from '../dto/user-context.dto';
import { SecurityDevicesRepository } from '../../security-devices/repositories/security-devices.repository';
import { parseJwtTime } from '../../../../core/utils/parse-jwt-time';
import { UserAccountsConfig } from '../../config/user-accounts.config';

function extractJwt(req: Request): string | null {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return req.cookies.refreshToken || null;
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    private readonly securityDevicesRepository: SecurityDevicesRepository,
    userAccountsConfig: UserAccountsConfig,
  ) {
    super({
      jwtFromRequest: extractJwt,
      ignoreExpiration: false,
      secretOrKey: userAccountsConfig.refreshTokenSecret,
    });
  }

  async validate(payload: RefreshTokenDto): Promise<RefreshTokenDto | null> {
    const device = await this.securityDevicesRepository.findBy({
      deviceId: payload.deviceId,
      userId: payload.id,
      issuedAt: parseJwtTime(payload.iat),
    });

    if (!device) {
      return null;
    }

    return payload;
  }
}
