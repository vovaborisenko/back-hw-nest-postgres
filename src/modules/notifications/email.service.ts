import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { EmailManager } from './email.manager';

@Injectable()
export class EmailService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly emailManager: EmailManager,
  ) {}

  async sendConfirmationEmail(email: string, code: string): Promise<void> {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Confirmation Email',
      html: this.emailManager.emailConfirmation(code),
    });
  }

  async sendPasswordRecovery(email: string, code: string): Promise<void> {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Password Recovery',
      html: this.emailManager.passwordRecovery(code),
    });
  }
}
