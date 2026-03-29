import { GetSecurityDevicesQueryHandler } from './queries/get-security-devices.query';
import { CreateSecurityDeviceUseCase } from './usecases/create-security-device.usecase';
import { DeleteSecurityDeviceUseCase } from './usecases/delete-security-device.usecase';
import { DeleteSecurityDevicesUseCase } from './usecases/delete-security-devices.usecase';
import { UpdateSecurityDeviceUseCase } from './usecases/update-security-device.usecase';

export const securityDevicesHandlers = [
  GetSecurityDevicesQueryHandler,
  CreateSecurityDeviceUseCase,
  DeleteSecurityDeviceUseCase,
  DeleteSecurityDevicesUseCase,
  UpdateSecurityDeviceUseCase,
];
