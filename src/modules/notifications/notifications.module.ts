import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { EmailService } from './email.service';
import { EmailManager } from './email.manager';
import { NotificationsConfig } from './notifications.config';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [NotificationsConfig],
      extraProviders: [NotificationsConfig],
      useFactory(config: NotificationsConfig) {
        return {
          transport: {
            service: config.emailTransportService,
            auth: {
              user: config.email,
              pass: config.emailPassword,
            },
          },
          defaults: {
            from: `"${config.emailName}" <${config.email}>`,
          },
        };
      },
    }),
  ],
  providers: [EmailService, EmailManager, NotificationsConfig],
  exports: [EmailService],
})
export class NotificationsModule {}
