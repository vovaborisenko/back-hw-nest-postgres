import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeleteSecurityDeviceDto } from '../../dto/delete-security-device.dto';
import { SecurityDevicesRepository } from '../../repositories/security-devices.repository';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-code';

export class DeleteSecurityDeviceCommand extends Command<void> {
  constructor(public readonly dto: DeleteSecurityDeviceDto) {
    super();
  }
}

@CommandHandler(DeleteSecurityDeviceCommand)
export class DeleteSecurityDeviceUseCase implements ICommandHandler<DeleteSecurityDeviceCommand> {
  constructor(
    private readonly securityDevicesRepository: SecurityDevicesRepository,
  ) {}

  async execute({ dto }: DeleteSecurityDeviceCommand): Promise<void> {
    const securityDevice =
      await this.securityDevicesRepository.findByIdOrNotFountFail(dto.deviceId);

    if (securityDevice.user_id !== dto.userId) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'Not your device',
      });
    }

    await this.securityDevicesRepository.deleteById(dto.deviceId);
  }
}
