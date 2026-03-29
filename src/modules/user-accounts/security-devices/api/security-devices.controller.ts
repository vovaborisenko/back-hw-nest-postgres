import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  UseGuards,
} from '@nestjs/common';
import { PARAM, PATH } from '../../../../core/constants/paths';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { GetSecurityDevicesQuery } from '../application/queries/get-security-devices.query';
import { SecurityDeviceViewDto } from './view-dto/security-device.view-dto';
import { JwtRefreshAuthGuard } from '../../guards/bearer/jwt-refresh-auth.guard';
import { ExtractUserFromRequestDecorator } from '../../guards/decorators/param/extract-user-from-request.decorator';
import { RefreshTokenDto } from '../../guards/dto/user-context.dto';
import { DeleteSecurityDeviceCommand } from '../application/usecases/delete-security-device.usecase';
import { DeleteSecurityDevicesCommand } from '../application/usecases/delete-security-devices.usecase';

const { PREFIX, SINGLE } = PATH.DEVICES;

@UseGuards(JwtRefreshAuthGuard)
@Controller(PREFIX)
export class SecurityDevicesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  getAllDevices(
    @ExtractUserFromRequestDecorator() dto: RefreshTokenDto,
  ): Promise<SecurityDeviceViewDto[]> {
    return this.queryBus.execute(new GetSecurityDevicesQuery(dto.id));
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteDevices(@ExtractUserFromRequestDecorator() dto: RefreshTokenDto) {
    await this.commandBus.execute(
      new DeleteSecurityDevicesCommand({
        userId: dto.id,
        deviceId: dto.deviceId,
      }),
    );
  }

  @Delete(SINGLE)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteDevice(
    @ExtractUserFromRequestDecorator() dto: RefreshTokenDto,
    @Param(PARAM.ID) deviceId: string,
  ) {
    await this.commandBus.execute(
      new DeleteSecurityDeviceCommand({ userId: dto.id, deviceId }),
    );
  }
}
