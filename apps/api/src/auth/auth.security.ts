import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const TEACHER_INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function configuredWebOrigin(): string {
  const value = process.env.WEB_ORIGIN ?? 'http://localhost:5173';
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
      throw new Error();
    }
    return url.origin;
  } catch {
    throw new Error('WEB_ORIGIN must be an HTTP(S) origin without a path, query, or fragment.');
  }
}

export function createOpaqueToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashOpaqueToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function readCookie(header: string | undefined, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const separator = part.indexOf('=');
    if (separator < 0 || part.slice(0, separator).trim() !== name) continue;
    const value = part.slice(separator + 1).trim();
    try { return decodeURIComponent(value); } catch { return undefined; }
  }
  return undefined;
}

export function safeSecretEquals(provided: string, expected: string): boolean {
  const providedHash = createHash('sha256').update(provided).digest();
  const expectedHash = createHash('sha256').update(expected).digest();
  return timingSafeEqual(providedHash, expectedHash);
}
