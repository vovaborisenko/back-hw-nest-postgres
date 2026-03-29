import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { Types } from 'mongoose';
import { SecurityDeviceViewDto } from '../../api/view-dto/security-device.view-dto';
import { SecurityDevicesQueryRepository } from '../../repositories/security-devices.query-repository';

export class GetSecurityDevicesQuery extends Query<SecurityDeviceViewDto[]> {
  constructor(public readonly userId: string | Types.ObjectId) {
    super();
  }
}

@QueryHandler(GetSecurityDevicesQuery)
export class GetSecurityDevicesQueryHandler implements IQueryHandler<GetSecurityDevicesQuery> {
  constructor(
    private readonly securityDevicesQueryRepository: SecurityDevicesQueryRepository,
  ) {}

  async execute({
    userId,
  }: GetSecurityDevicesQuery): Promise<SecurityDeviceViewDto[]> {
    return this.securityDevicesQueryRepository.findActiveByUserId(userId);
  }
}
