import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { appSetup } from './setup/app.setup';
import { CoreConfig } from './core/core.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const coreConfig = app.get(CoreConfig);
  const port = coreConfig.port;

  appSetup(app);

  await app.listen(port, () => {
    console.log(`Listening on port ${port}`);
    console.log('NODE_ENV: ', coreConfig.env);
  });
}

bootstrap();
