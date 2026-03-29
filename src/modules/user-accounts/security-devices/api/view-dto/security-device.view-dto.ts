import { SecurityDeviceRaw } from '../../domain/security-device.entity';

export class SecurityDeviceViewDto {
  ip: string;
  title: string;
  lastActiveDate: string;
  deviceId: string;

  static mapToView(device: SecurityDeviceRaw): SecurityDeviceViewDto {
    const dto = new SecurityDeviceViewDto();

    dto.ip = device.ip || '';
    dto.deviceId = device.id;
    dto.lastActiveDate = device.issued_at.toISOString();
    dto.title = device.name;

    return dto;
  }
}
