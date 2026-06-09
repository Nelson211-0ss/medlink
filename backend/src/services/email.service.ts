import { sendMail } from '../config/mailer';
import { env } from '../config/env';

const wrap = (title: string, body: string) => `
  <div style="font-family:Inter,Arial,sans-serif;background:#F8FAFC;padding:32px">
    <div style="max-width:560px;margin:auto;background:#fff;border-radius:12px;padding:32px;border:1px solid #E2E8F0">
      <h1 style="color:#2563EB;font-size:20px;margin:0 0 16px">MediLink</h1>
      <h2 style="color:#1E293B;font-size:18px;margin:0 0 12px">${title}</h2>
      <div style="color:#475569;font-size:14px;line-height:1.6">${body}</div>
      <p style="color:#94A3B8;font-size:12px;margin-top:24px">
        Connecting healthcare talent with opportunity.
      </p>
    </div>
  </div>`;

const button = (url: string, label: string) =>
  `<a href="${url}" style="display:inline-block;margin:16px 0;background:#2563EB;color:#fff;
    padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">${label}</a>`;

export class EmailService {
  async sendWelcome(to: string, name: string): Promise<void> {
    await sendMail({
      to,
      subject: 'Welcome to MediLink',
      html: wrap('Welcome aboard', `<p>Hi ${name}, your MediLink account has been created.</p>`),
    });
  }

  async sendVerification(to: string, name: string, token: string): Promise<void> {
    const url = `${env.FRONTEND_URL}/verify-email?token=${token}`;
    await sendMail({
      to,
      subject: 'Verify your email',
      html: wrap(
        'Confirm your email',
        `<p>Hi ${name}, please confirm your email address.</p>${button(url, 'Verify email')}
         <p>Or paste this link: <br/>${url}</p>`,
      ),
    });
  }

  async sendPasswordReset(to: string, name: string, token: string): Promise<void> {
    const url = `${env.FRONTEND_URL}/reset-password?token=${token}`;
    await sendMail({
      to,
      subject: 'Reset your password',
      html: wrap(
        'Reset password',
        `<p>Hi ${name}, we received a request to reset your password.</p>${button(url, 'Reset password')}
         <p>If you did not request this, ignore this email.</p>`,
      ),
    });
  }

  async sendApplicationUpdate(to: string, name: string, jobTitle: string, stage: string) {
    await sendMail({
      to,
      subject: `Application update: ${jobTitle}`,
      html: wrap(
        'Application update',
        `<p>Hi ${name}, your application for <strong>${jobTitle}</strong> moved to <strong>${stage}</strong>.</p>`,
      ),
    });
  }

  async sendInvitation(to: string, name: string, orgName: string) {
    await sendMail({
      to,
      subject: `${orgName} invited you to apply`,
      html: wrap(
        'New invitation',
        `<p>Hi ${name}, <strong>${orgName}</strong> has invited you to connect on MediLink.</p>
         ${button(`${env.FRONTEND_URL}/invitations`, 'View invitation')}`,
      ),
    });
  }
}
