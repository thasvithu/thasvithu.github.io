import nodemailer, { type Transporter } from 'nodemailer';
import { config } from './config.js';

type ContactMailPayload = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

type SendResult = {
  sent: boolean;
  reason?: string;
};

let transporter: Transporter | undefined;

function getTransporter(): Transporter | null {
  if (transporter) return transporter;

  if (!config.smtpHost || !config.smtpUser || !config.smtpPass) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpSecure,
    auth: {
      user: config.smtpUser,
      pass: config.smtpPass
    }
  });

  return transporter;
}

export async function sendContactMail({ name, email, subject, message }: ContactMailPayload): Promise<SendResult> {
  const tx = getTransporter();
  if (!tx || !config.mailTo) {
    return { sent: false, reason: 'SMTP not configured' };
  }

  await tx.sendMail({
    from: config.mailFrom,
    to: config.mailTo,
    replyTo: email,
    subject: `Portfolio Contact: ${subject}`,
    text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
    html: `<p><strong>Name:</strong> ${escapeHtml(name)}</p><p><strong>Email:</strong> ${escapeHtml(
      email
    )}</p><p><strong>Subject:</strong> ${escapeHtml(subject)}</p><p><strong>Message:</strong><br>${escapeHtml(
      message
    ).replace(/\n/g, '<br>')}</p>`
  });

  return { sent: true };
}

function escapeHtml(value: string): string {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
