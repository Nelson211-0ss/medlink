import nodemailer from 'nodemailer';
import { env } from './env';
import { logger } from './logger';

export const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_SECURE,
  auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } : undefined,
});

export const sendMail = async (opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<void> => {
  try {
    await transporter.sendMail({ from: env.MAIL_FROM, ...opts });
    logger.debug({ to: opts.to, subject: opts.subject }, 'Email sent');
  } catch (err) {
    logger.error({ err, to: opts.to }, 'Failed to send email');
  }
};
