import { SecurityDevice } from '../domain/security-device.entity';
import { Injectable } from '@nestjs/common';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-code';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, IsNull, Not, Repository } from 'typeorm';

@Injectable()
export class SecurityDevicesRepository {
  constructor(
    @InjectRepository(SecurityDevice)
    private readonly securityDeviceRepo: Repository<SecurityDevice>,
  ) {}

  async save(securityDevice: SecurityDevice): Promise<void> {
    await this.securityDeviceRepo.save(securityDevice);
  }

  async deleteOthersByUser({
    deviceId,
    userId,
  }: {
    deviceId: string;
    userId: number;
  }): Promise<boolean> {
    const { affected = 0 } = await this.securityDeviceRepo.softDelete({
      deviceId: Not(deviceId),
      userId,
      deletedAt: IsNull(),
    });

    return affected > 0;
  }

  async deleteById(deviceId: string): Promise<boolean> {
    const { affected = 0 } = await this.securityDeviceRepo.softDelete({
      deviceId,
      deletedAt: IsNull(),
    });

    return affected > 0;
  }

  async findById(deviceId: string): Promise<SecurityDevice | null> {
    try {
      return await this.securityDeviceRepo.findOneBy({ deviceId });
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  async findByIdOrNotFountFail(id: string): Promise<SecurityDevice> {
    const foundDevice = await this.findById(id);

    if (!foundDevice) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Device Not Found',
      });
    }

    return foundDevice;
  }

  findOneBy(
    where:
      | FindOptionsWhere<SecurityDevice>
      | FindOptionsWhere<SecurityDevice>[],
  ): Promise<SecurityDevice | null> {
    return this.securityDeviceRepo.findOneBy(where);
  }
}
