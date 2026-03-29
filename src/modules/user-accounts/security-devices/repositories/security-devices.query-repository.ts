import { Injectable } from '@nestjs/common';
import { SecurityDeviceViewDto } from '../api/view-dto/security-device.view-dto';
import { SecurityDeviceRaw } from '../domain/security-device.entity';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class SecurityDevicesQueryRepository {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async findActiveByUserId(userId: number): Promise<SecurityDeviceViewDto[]> {
    const items = await this.dataSource.query<SecurityDeviceRaw[]>(
      `
      SELECT * 
      FROM security_devices
      WHERE user_id = $1 AND deleted_at is null 
    `,
      [userId],
    );

    return items.map((item) => SecurityDeviceViewDto.mapToView(item));
  }
}
