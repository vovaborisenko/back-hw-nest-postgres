import { SecurityDevice } from '../../domain/security-device.entity';

export class SecurityDeviceViewDto {
  ip: string;
  title: string;
  lastActiveDate: string;
  deviceId: string;

  static mapToView(device: SecurityDevice): SecurityDeviceViewDto {
    const dto = new SecurityDeviceViewDto();

    dto.ip = device.ip || '';
    dto.deviceId = device.deviceId;
    dto.lastActiveDate = device.issuedAt.toISOString();
    dto.title = device.deviceName;

    return dto;
  }
}
