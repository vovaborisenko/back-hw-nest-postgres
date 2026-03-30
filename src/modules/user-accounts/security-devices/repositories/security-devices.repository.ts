import { SecurityDeviceRaw } from '../domain/security-device.entity';
import { Injectable } from '@nestjs/common';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-code';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CreateSecurityDeviceDomainDto } from '../domain/dto/create-secirity-device.domain-dto';
import { parseJwtTime } from '../../../../core/utils/parse-jwt-time';

@Injectable()
export class SecurityDevicesRepository {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async deleteOthersByUser({
    deviceId,
    userId,
  }: {
    deviceId: string;
    userId: number;
  }): Promise<boolean> {
    const [, deletedCount] = await this.dataSource.query<[[], number]>(
      `
        UPDATE security_devices
        SET deleted_at = $1
        WHERE id != $2 AND deleted_at is null AND user_id = $3
      `,
      [new Date(), deviceId, userId],
    );

    return deletedCount > 0;
  }

  async deleteById(deviceId: string): Promise<boolean> {
    const [, deletedCount] = await this.dataSource.query<[[], number]>(
      `
      UPDATE security_devices
      SET deleted_at = $1
      WHERE id = $2 AND deleted_at is null
      `,
      [new Date(), deviceId],
    );

    return deletedCount > 0;
  }

  async updateById(
    deviceId: string,
    dto: { exp: number; iat: number },
  ): Promise<boolean> {
    const [, updatedCount] = await this.dataSource.query<[[], number]>(
      `
      UPDATE security_devices
      SET expired_at = $2, issued_at = $3
      WHERE id = $1 AND deleted_at is null
      `,
      [deviceId, parseJwtTime(dto.exp), parseJwtTime(dto.iat)],
    );

    return updatedCount > 0;
  }

  async findById(id: string): Promise<SecurityDeviceRaw | null> {
    try {
      const [user = null] = await this.dataSource.query<SecurityDeviceRaw[]>(
        `
      SELECT * 
      FROM security_devices 
      WHERE id = $1`,
        [id],
      );

      return user;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  async findByIdOrNotFountFail(id: string): Promise<SecurityDeviceRaw> {
    const foundDevice = await this.findById(id);

    if (!foundDevice) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Device Not Found',
      });
    }

    return foundDevice;
  }

  async findBy(filter: {
    deviceId: string;
    userId: number;
    issuedAt: Date;
  }): Promise<SecurityDeviceRaw | null> {
    const [device = null] = await this.dataSource.query<SecurityDeviceRaw[]>(
      `
    SELECT * 
    FROM security_devices
    WHERE id = $1 AND deleted_at is null AND user_id = $2 AND issued_at = $3
    `,
      [filter.deviceId, filter.userId, filter.issuedAt],
    );

    return device;
  }

  create(dto: CreateSecurityDeviceDomainDto) {
    return this.dataSource.query(
      `
      INSERT INTO security_devices 
        (id, name, ip, user_id, expired_at, issued_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [
        dto.deviceId,
        dto.deviceName,
        dto.ip,
        dto.userId,
        parseJwtTime(dto.exp),
        parseJwtTime(dto.iat),
      ],
    );
  }
}
