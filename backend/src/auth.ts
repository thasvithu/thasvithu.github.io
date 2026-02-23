import crypto from 'node:crypto';
import jwt, { type JwtPayload, type SignOptions } from 'jsonwebtoken';
import type { Config } from './config.js';

export type AdminClaims = JwtPayload & {
  sub: string;
  role: 'admin';
};

export function createAuthHelpers(config: Config) {
  function signAdminToken(payload: Pick<AdminClaims, 'sub' | 'role'>): string {
    if (!config.jwtSecret) {
      throw new Error('JWT_SECRET is not configured');
    }
    return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn } as SignOptions);
  }

  function verifyAdminToken(token: string): AdminClaims {
    if (!config.jwtSecret) {
      throw new Error('JWT_SECRET is not configured');
    }
    return jwt.verify(token, config.jwtSecret) as AdminClaims;
  }

  function credentialsValid(username: string, password: string): boolean {
    if (!config.adminUsername || !config.adminPassword) {
      return false;
    }

    const safeUser = safeCompare(username, config.adminUsername);
    const safePass = safeCompare(password, config.adminPassword);
    return safeUser && safePass;
  }

  return { signAdminToken, verifyAdminToken, credentialsValid };
}

function safeCompare(left: string, right: string): boolean {
  const a = Buffer.from(String(left || ''));
  const b = Buffer.from(String(right || ''));
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
