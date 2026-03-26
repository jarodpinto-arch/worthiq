import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService implements OnModuleInit {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.configService.get<string>('GMAIL_USER'),
        pass: this.configService.get<string>('GMAIL_APP_PASSWORD'),
      },
    });
  }

  onModuleInit() {
    const user = this.configService.get<string>('GMAIL_USER');
    const pass = this.configService.get<string>('GMAIL_APP_PASSWORD');
    if (!user || !pass) {
      this.logger.warn(
        'GMAIL_USER or GMAIL_APP_PASSWORD is missing — password reset emails will fail until both are set (e.g. on Railway).',
      );
    }
    const fe = this.configService.get<string>('FRONTEND_URL');
    const prod = this.configService.get<string>('NODE_ENV') === 'production';
    if (prod && (!fe || fe.includes('localhost'))) {
      this.logger.warn(
        `FRONTEND_URL is "${fe || 'unset'}" in production — reset emails must use your real domain (e.g. https://worthiq.io).`,
      );
    }
  }

  async sendPasswordReset(toEmail: string, resetUrl: string) {
    const fromEmail = this.configService.get<string>('GMAIL_USER');

    try {
      await this.transporter.sendMail({
        from: `"WorthIQ" <${fromEmail}>`,
        to: toEmail,
        subject: 'Reset your WorthIQ password',
        text: `Reset your WorthIQ password (link expires in 1 hour):\n\n${resetUrl}\n\nIf you didn't request this, ignore this email.`,
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #0A0C10; color: #cbd5e1; border-radius: 16px;">
            <h1 style="font-size: 28px; font-weight: 900; font-style: italic; color: #fff; margin-bottom: 4px;">WorthIQ</h1>
            <p style="color: #3b82f6; font-size: 11px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; margin-top: 0;">Password Reset</p>
            <hr style="border-color: #1e293b; margin: 24px 0;" />
            <p style="margin-bottom: 24px;">We received a request to reset your password. Click the button below — this link expires in <strong style="color:#fff;">1 hour</strong>.</p>
            <a href="${resetUrl}" style="display: inline-block; background: #2563eb; color: #fff; padding: 14px 28px; border-radius: 12px; font-weight: 700; text-decoration: none; font-size: 15px;">
              Reset Password
            </a>
            <p style="margin-top: 24px; font-size: 12px; color: #475569;">If you didn't request this, you can safely ignore this email. Your password won't change.</p>
            <p style="margin-top: 8px; font-size: 12px; color: #334155;">Or copy this link: <a href="${resetUrl}" style="color: #3b82f6;">${resetUrl}</a></p>
          </div>
        `,
      });
      this.logger.log(`Password reset email sent to ${toEmail}`);
    } catch (err) {
      this.logger.error(
        `Failed to send reset email to ${toEmail}:`,
        err.message,
      );
      throw err;
    }
  }
}
