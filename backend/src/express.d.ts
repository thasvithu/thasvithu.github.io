import type { AdminClaims } from './auth.js';

declare global {
  namespace Express {
    interface Request {
      admin?: AdminClaims;
      requestId?: string;
    }
  }
}

export {};
