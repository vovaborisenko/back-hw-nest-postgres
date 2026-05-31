import { User } from '../../domain/user.entity';
import { CreateSecurityDeviceDomainDto } from './dto/create-secirity-device.domain-dto';
import { UpdateSecurityDeviceDomainDto } from './dto/update-secirity-device.domain-dto';
import { parseJwtTime } from '../../../../core/utils/parse-jwt-time';
import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseDbEntity } from '../../../../core/domain/baseDbEntity';

@Entity()
export class SecurityDevice extends BaseDbEntity {
  @Column()
  deviceName: string;

  @Column({ type: 'uuid' })
  deviceId: string;

  @Column({ type: 'timestamptz' })
  expiredAt: Date;

  @Column({ type: 'varchar', nullable: true })
  ip: string | null;

  @Column({ type: 'timestamptz' })
  issuedAt: Date;

  @ManyToOne(() => User, (user) => user.securityDevices, { nullable: false })
  user: User;

  @Column({ nullable: false })
  userId: number;

  static create(dto: CreateSecurityDeviceDomainDto) {
    const device = new this();

    device.userId = dto.userId;
    device.deviceId = dto.deviceId;
    device.deviceName = dto.deviceName;
    device.expiredAt = parseJwtTime(dto.exp);
    device.ip = dto.ip;
    device.issuedAt = parseJwtTime(dto.iat);

    return device;
  }

  update(dto: UpdateSecurityDeviceDomainDto) {
    this.expiredAt = parseJwtTime(dto.exp);
    this.issuedAt = parseJwtTime(dto.iat);
  }
}
