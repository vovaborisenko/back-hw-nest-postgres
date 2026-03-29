import { QueryFilter, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import {
  SecurityDevice,
  SecurityDeviceDocument,
  type SecurityDeviceModelType,
} from '../domain/security-device.entity';
import { Injectable } from '@nestjs/common';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-code';

@Injectable()
export class SecurityDevicesRepository {
  constructor(
    @InjectModel(SecurityDevice.name)
    private readonly SecurityDeviceModel: SecurityDeviceModelType,
  ) {}

  async save(document: SecurityDeviceDocument): Promise<void> {
    await document.save();
  }

  async deleteOthersByUser({
    deviceId,
    userId,
  }: {
    deviceId: string;
    userId: string;
  }): Promise<boolean> {
    const result = await this.SecurityDeviceModel.updateMany(
      {
        userId: new Types.ObjectId(userId),
        deviceId: { $ne: deviceId },
        deletedAt: null,
      },
      { $set: { deletedAt: new Date() } },
    );

    return result.modifiedCount > 0;
  }

  findById(
    id: string | Types.ObjectId,
  ): Promise<SecurityDeviceDocument | null> {
    return this.SecurityDeviceModel.findById(id);
  }

  findBy(
    device: Partial<Omit<SecurityDevice, 'userId'> & { userId: string }>,
  ): Promise<SecurityDeviceDocument | null> {
    const { userId, ...rest } = device;

    const filter: QueryFilter<SecurityDeviceDocument> = rest;
    filter.deletedAt = null;

    if (userId !== undefined) {
      filter.userId = new Types.ObjectId(userId);
    }

    return this.SecurityDeviceModel.findOne(filter);
  }

  async findByOrNotFountFail(
    device: Partial<Omit<SecurityDevice, 'userId'> & { userId: string }>,
  ): Promise<SecurityDeviceDocument> {
    const foundDevice = await this.findBy(device);

    if (!foundDevice) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Device Not Found',
      });
    }

    return foundDevice;
  }
}
