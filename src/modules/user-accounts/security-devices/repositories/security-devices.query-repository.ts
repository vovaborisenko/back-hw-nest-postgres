import { Injectable } from '@nestjs/common';
import { SecurityDeviceViewDto } from '../api/view-dto/security-device.view-dto';
import { SecurityDevice } from '../domain/security-device.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class SecurityDevicesQueryRepository {
  constructor(
    @InjectRepository(SecurityDevice)
    private readonly securityDeviceRepo: Repository<SecurityDevice>,
  ) {}

  async findActiveByUserId(userId: number): Promise<SecurityDeviceViewDto[]> {
    const items = await this.securityDeviceRepo.findBy({ userId });

    return items.map((item) => SecurityDeviceViewDto.mapToView(item));
  }
}
