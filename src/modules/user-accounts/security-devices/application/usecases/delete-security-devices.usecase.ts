import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeleteSecurityDeviceDto } from '../../dto/delete-security-device.dto';
import { SecurityDevicesRepository } from '../../repositories/security-devices.repository';

export class DeleteSecurityDevicesCommand extends Command<void> {
  constructor(public readonly dto: DeleteSecurityDeviceDto) {
    super();
  }
}

@CommandHandler(DeleteSecurityDevicesCommand)
export class DeleteSecurityDevicesUseCase implements ICommandHandler<DeleteSecurityDevicesCommand> {
  constructor(
    private readonly securityDevicesRepository: SecurityDevicesRepository,
  ) {}

  async execute({ dto }: DeleteSecurityDevicesCommand): Promise<void> {
    await this.securityDevicesRepository.deleteOthersByUser(dto);
  }
}
