export interface CreateSecurityDeviceDomainDto {
  ip: string | null;
  userId: number;
  deviceId: string;
  deviceName: string;
  exp: number;
  iat: number;
}
