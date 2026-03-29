import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model, Types } from 'mongoose';
import { User } from '../../domain/user.entity';
import { CreateSecurityDeviceDomainDto } from './dto/create-secirity-device.domain-dto';
import { UpdateSecurityDeviceDomainDto } from './dto/update-secirity-device.domain-dto';
import { parseJwtTime } from '../../../../core/utils/parse-jwt-time';

@Schema({ timestamps: true })
export class SecurityDevice {
  @Prop({ type: String, required: true, unique: true })
  deviceId: string;

  @Prop({ type: String, required: true })
  deviceName: string;

  @Prop({ type: Date, default: Date.now })
  expiredAt: Date;

  @Prop({ type: String, required: true, nullable: true })
  ip: string | null;

  @Prop({ type: Date, required: true })
  issuedAt: Date;

  @Prop({ type: Types.ObjectId, required: true, ref: User.name })
  userId: Types.ObjectId;

  createdAt: Date;

  @Prop({ type: Date, nullable: true, default: null })
  deletedAt: Date | null;

  static createInstance(dto: CreateSecurityDeviceDomainDto) {
    const device = new this();

    device.userId = new Types.ObjectId(dto.userId);
    device.deviceId = dto.deviceId;
    device.deviceName = dto.deviceName;
    device.expiredAt = parseJwtTime(dto.exp);
    device.ip = dto.ip;
    device.issuedAt = parseJwtTime(dto.iat);

    return device as SecurityDeviceDocument;
  }

  makeDeleted() {
    if (this.deletedAt !== null) {
      throw new Error('Entity already deleted');
    }

    this.deletedAt = new Date();
  }

  update(dto: UpdateSecurityDeviceDomainDto) {
    this.expiredAt = parseJwtTime(dto.exp);
    this.issuedAt = parseJwtTime(dto.iat);
  }
}

export const SecurityDeviceSchema =
  SchemaFactory.createForClass(SecurityDevice);

SecurityDeviceSchema.loadClass(SecurityDevice);

export type SecurityDeviceDocument = HydratedDocument<SecurityDevice>;
export type SecurityDeviceModelType = Model<SecurityDeviceDocument> &
  typeof SecurityDevice;
