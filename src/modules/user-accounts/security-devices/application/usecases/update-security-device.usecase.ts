import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateSecurityDeviceDto } from '../../dto/update-security-device.dto';
import { SecurityDevicesRepository } from '../../repositories/security-devices.repository';
import { Inject } from '@nestjs/common';
import { INJECT_TOKEN } from '../../../constants/inject-token';
import { JwtService } from '@nestjs/jwt';
import { RefreshTokenDto } from '../../../guards/dto/user-context.dto';

export class UpdateSecurityDeviceCommand extends Command<void> {
  constructor(public readonly dto: UpdateSecurityDeviceDto) {
    super();
  }
}

@CommandHandler(UpdateSecurityDeviceCommand)
export class UpdateSecurityDeviceUseCase implements ICommandHandler<UpdateSecurityDeviceCommand> {
  constructor(
    private readonly securityDevicesRepository: SecurityDevicesRepository,
    @Inject(INJECT_TOKEN.REFRESH)
    private readonly refreshTokenContext: JwtService,
  ) {}

  async execute({ dto }: UpdateSecurityDeviceCommand): Promise<void> {
    const { id, deviceId, exp, iat } =
      this.refreshTokenContext.decode<RefreshTokenDto>(dto.refreshToken);

    const securityDevice = await this.securityDevicesRepository.findBy({
      deviceId,
      userId: id,
    });

    if (!securityDevice) {
      return;
    }

    securityDevice.update({ exp, iat });

    await this.securityDevicesRepository.save(securityDevice);
  }
}
