import { Agent } from 'useragent';

export interface CreateSecurityDeviceDto {
  ip: string | null;
  userAgent: Agent;
  refreshToken: string;
}
