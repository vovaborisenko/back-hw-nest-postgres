import { Request } from 'express';
import requestIp from 'request-ip';
import { createParamDecorator } from '@nestjs/common';

export const IpAddress = createParamDecorator<void, string | null>(
  (_, context) => {
    const request = context.switchToHttp().getRequest<Request>();

    return requestIp.getClientIp(request);
  },
);
