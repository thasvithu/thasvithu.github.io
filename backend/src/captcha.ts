import { config } from './config.js';

type CaptchaResult = { ok: boolean; reason: string };

type TurnstileResponse = {
  success?: boolean;
  'error-codes'?: string[];
};

export async function verifyCaptchaToken(token?: string, remoteIp?: string): Promise<CaptchaResult> {
  if (!config.turnstileSecretKey) {
    return { ok: !config.turnstileRequired, reason: 'not-configured' };
  }

  const params = new URLSearchParams();
  params.set('secret', config.turnstileSecretKey);
  params.set('response', token || '');
  if (remoteIp) params.set('remoteip', remoteIp);

  let response: Response;
  try {
    response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
      signal: AbortSignal.timeout(10_000)
    });
  } catch (_error) {
    return { ok: false, reason: 'captcha-timeout' };
  }

  if (!response.ok) {
    return { ok: false, reason: 'captcha-service-unavailable' };
  }

  const result = (await response.json()) as TurnstileResponse;
  return { ok: Boolean(result.success), reason: result['error-codes']?.join(',') || '' };
}
