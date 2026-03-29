export interface CreateSecurityDeviceDomainDto {
  ip: string | null;
  userId: string;
  deviceId: string;
  deviceName: string;
  exp: number;
  iat: number;
}
