import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';

interface SendMailPayload {
  to?: string | null;
  subject: string;
  text?: string;
  html?: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;
  private readonly fromEmail: string | null;
  private readonly fromName: string | null;
  private readonly enabled: boolean;
  private readonly fallbackEmail: string | null;

  constructor(private readonly configService: ConfigService) {
    const mailer = this.configService.get<string>('MAIL_MAILER', 'smtp');
    const host = this.configService.get<string>('MAIL_HOST');
    const port = Number(this.configService.get<string>('MAIL_PORT') ?? '0');
    const username = this.configService.get<string>('MAIL_USERNAME');
    const password = this.configService.get<string>('MAIL_PASSWORD');
    const encryption = (this.configService.get<string>('MAIL_ENCRYPTION') || '').toLowerCase();

    this.fromEmail = this.configService.get<string>('MAIL_FROM_ADDRESS') || username || null;
    this.fromName = this.configService.get<string>('MAIL_FROM_NAME') || null;
    this.fallbackEmail = this.configService.get<string>('CONTACT_TO_EMAIL') || null;

    if (mailer !== 'smtp') {
      this.enabled = false;
      this.logger.warn(`Unsupported mailer "${mailer}". Emails will be disabled.`);
      return;
    }

    if (!host || !username || !password || !this.fromEmail) {
      this.enabled = false;
      this.logger.warn('Mail configuration incomplete. Emails will be disabled.');
      return;
    }

    this.enabled = true;

    const secure = encryption === 'ssl' || encryption === 'tls' || port === 465;

    this.transporter = nodemailer.createTransport({
      host,
      port: port > 0 ? port : secure ? 465 : 587,
      secure,
      auth: {
        user: username,
        pass: password,
      },
    });
  }

  async sendMail(payload: SendMailPayload): Promise<void> {
    if (!this.enabled || !this.transporter) {
      this.logger.warn(
        `Mail service disabled. Skipping email "${payload.subject}" (target: ${payload.to ?? 'n/a'}).`,
      );
      return;
    }

    try {
      const recipient = payload.to?.trim() || this.fallbackEmail;
      if (!recipient) {
        this.logger.warn(
          `No recipient email provided for "${payload.subject}". Email not sent.`,
        );
        return;
      }

      const from =
        this.fromName && this.fromEmail
          ? `"${this.fromName}" <${this.fromEmail}>`
          : this.fromEmail;

      await this.transporter.sendMail({
        from: from ?? undefined,
        to: recipient,
        subject: payload.subject,
        text: payload.text,
        html: payload.html,
      });
      this.logger.debug(`Email "${payload.subject}" sent to ${recipient}`);
    } catch (error) {
      this.logger.error('Failed to send email', error instanceof Error ? error.stack : error);
    }
  }
}
