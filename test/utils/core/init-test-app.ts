import { INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../../src/app.module';
import { appSetup } from '../../../src/setup/app.setup';
import { ThrottlerStorage } from '@nestjs/throttler';

export async function initTestApp() {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const nestApp = moduleFixture.createNestApplication<INestApplication<App>>();

  appSetup(nestApp);

  await nestApp.init();

  const throttlerStorage = moduleFixture.get(ThrottlerStorage);
  const httpServer = nestApp.getHttpServer();

  return { nestApp, throttlerStorage, httpServer };
}
