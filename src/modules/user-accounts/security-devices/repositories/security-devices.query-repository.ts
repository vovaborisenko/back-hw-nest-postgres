import { Injectable } from '@nestjs/common';
import { SecurityDeviceViewDto } from '../api/view-dto/security-device.view-dto';
import { InjectModel } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import {
  SecurityDevice,
  type SecurityDeviceModelType,
} from '../domain/security-device.entity';

@Injectable()
export class SecurityDevicesQueryRepository {
  constructor(
    @InjectModel(SecurityDevice.name)
    private readonly SecurityDeviceModel: SecurityDeviceModelType,
  ) {}

  async findActiveByUserId(
    userId: string | Types.ObjectId,
  ): Promise<SecurityDeviceViewDto[]> {
    const items = await this.SecurityDeviceModel.find({
      userId: new Types.ObjectId(userId),
      deletedAt: null,
      expiredAt: { $gte: new Date() },
    }).lean();

    return items.map((item) => SecurityDeviceViewDto.mapToView(item));
  }
}
