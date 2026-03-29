import { Request } from 'express';
import { createParamDecorator } from '@nestjs/common';
import * as useragent from 'useragent';

export const UserAgent = createParamDecorator<void, useragent.Agent>(
  (_, context) => {
    const { headers } = context.switchToHttp().getRequest<Request>();
    const uaString = headers['user-agent'];

    return useragent.parse(uaString);
  },
);
