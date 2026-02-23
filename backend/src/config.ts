import dotenv from 'dotenv';

dotenv.config();

export type Config = {
  port: number;
  corsOrigins: string[];
  databaseUrl: string;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPass: string;
  mailTo: string;
  mailFrom: string;
  adminUsername: string;
  adminPassword: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  supabaseStorageBucket: string;
  turnstileSecretKey: string;
  turnstileRequired: boolean;
};

export const config: Config = {
  port: Number(process.env.PORT || 4000),
  corsOrigins: (process.env.CORS_ORIGIN || '*')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  databaseUrl: process.env.DATABASE_URL || '',
  smtpHost: process.env.SMTP_HOST || '',
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpSecure: String(process.env.SMTP_SECURE || 'false') === 'true',
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
  mailTo: process.env.MAIL_TO || '',
  mailFrom: process.env.MAIL_FROM || 'Portfolio Contact <no-reply@example.com>',
  adminUsername: process.env.ADMIN_USERNAME || 'admin',
  adminPassword: process.env.ADMIN_PASSWORD || process.env.ADMIN_DASHBOARD_KEY || '',
  jwtSecret: process.env.JWT_SECRET || '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  supabaseStorageBucket: process.env.SUPABASE_STORAGE_BUCKET || 'portfolio-assets',
  turnstileSecretKey: process.env.TURNSTILE_SECRET_KEY || '',
  turnstileRequired: String(process.env.TURNSTILE_REQUIRED || 'false') === 'true'
};
