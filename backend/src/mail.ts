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
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
    auth: {
      user: config.smtpUser,
      pass: config.smtpPass
    }
  });

  return transporter;
}

export async function sendContactMail({ name, email, subject, message }: ContactMailPayload): Promise<SendResult> {
  if (!config.mailTo) {
    return { sent: false, reason: 'mail-to-not-configured' };
  }

  const text = `Name: ${name}\nEmail: ${email}\n\n${message}`;
  const html = `<p><strong>Name:</strong> ${escapeHtml(name)}</p><p><strong>Email:</strong> ${escapeHtml(
    email
  )}</p><p><strong>Subject:</strong> ${escapeHtml(subject)}</p><p><strong>Message:</strong><br>${escapeHtml(
    message
  ).replace(/\n/g, '<br>')}</p>`;

  if (config.resendApiKey) {
    const sentWithResend = await sendWithResend({ name, email, subject, text, html });
    if (sentWithResend.sent) return sentWithResend;
  }

  const tx = getTransporter();
  if (!tx) {
    return { sent: false, reason: config.resendApiKey ? 'resend-failed-and-smtp-not-configured' : 'smtp-not-configured' };
  }

  try {
    await tx.sendMail({
      from: config.mailFrom,
      to: config.mailTo,
      replyTo: email,
      subject: `Portfolio Contact: ${subject}`,
      text,
      html
    });
    return { sent: true };
  } catch (_error) {
    return { sent: false, reason: 'smtp-timeout-or-failure' };
  }
}

async function sendWithResend({
  name,
  email,
  subject,
  text,
  html
}: {
  name: string;
  email: string;
  subject: string;
  text: string;
  html: string;
}): Promise<SendResult> {
  const from = config.resendFrom || config.mailFrom;
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from,
        to: [config.mailTo],
        reply_to: email,
        subject: `Portfolio Contact: ${subject}`,
        text,
        html
      }),
      signal: AbortSignal.timeout(10_000)
    });

    if (!response.ok) {
      return { sent: false, reason: `resend-http-${response.status}` };
    }

    return { sent: true };
  } catch (_error) {
    return { sent: false, reason: 'resend-timeout-or-failure' };
  }
}

function escapeHtml(value: string): string {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
