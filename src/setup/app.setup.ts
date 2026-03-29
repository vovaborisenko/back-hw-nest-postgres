import { INestApplication } from '@nestjs/common';
import { pipesSetup } from './pipes.setup';
import { PATH } from '../core/constants/paths';
import cookieParser from 'cookie-parser';

export function appSetup(app: INestApplication) {
  app.enableCors();
  app.use(cookieParser());
  pipesSetup(app);
  app.setGlobalPrefix(PATH.PREFIX);
}
