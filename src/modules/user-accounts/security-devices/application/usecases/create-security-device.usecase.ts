import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateSecurityDeviceDto } from '../../dto/create-security-device.dto';
import {
  SecurityDevice,
  type SecurityDeviceModelType,
} from '../../domain/security-device.entity';
import { InjectModel } from '@nestjs/mongoose';
import { SecurityDevicesRepository } from '../../repositories/security-devices.repository';
import { Inject } from '@nestjs/common';
import { INJECT_TOKEN } from '../../../constants/inject-token';
import { JwtService } from '@nestjs/jwt';
import { RefreshTokenDto } from '../../../guards/dto/user-context.dto';

export class CreateSecurityDeviceCommand extends Command<void> {
  constructor(public readonly dto: CreateSecurityDeviceDto) {
    super();
  }
}

@CommandHandler(CreateSecurityDeviceCommand)
export class CreateSecurityDeviceUseCase implements ICommandHandler<CreateSecurityDeviceCommand> {
  constructor(
    @InjectModel(SecurityDevice.name)
    private readonly SecurityDeviceModel: SecurityDeviceModelType,
    private readonly securityDevicesRepository: SecurityDevicesRepository,
    @Inject(INJECT_TOKEN.REFRESH)
    private readonly refreshTokenContext: JwtService,
  ) {}

  async execute({ dto }: CreateSecurityDeviceCommand): Promise<void> {
    const { id, deviceId, exp, iat } =
      this.refreshTokenContext.decode<RefreshTokenDto>(dto.refreshToken);

    const securityDevice = this.SecurityDeviceModel.createInstance({
      ip: dto.ip,
      userId: id,
      deviceId,
      deviceName: dto.userAgent.toString(),
      exp,
      iat,
    });

    await this.securityDevicesRepository.save(securityDevice);
  }
}
