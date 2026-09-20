import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

/** HMAC-SHA256 as lowercase hex. */
export function hmacHex(secret: string, value: string): string {
  return createHmac('sha256', secret).update(value, 'utf8').digest('hex');
}

/** Constant-time comparison of two hex digests of the same length. */
export function safeEqualHex(a: string, b: string): boolean {
  const left = Buffer.from(a, 'hex');
  const right = Buffer.from(b, 'hex');
  if (left.length === 0 || left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

/** A URL-safe random token. 32 bytes = 256 bits of entropy. */
export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

/**
 * A numeric code of `digits` length, drawn without modulo bias.
 * Leading zeros are preserved, so "000123" is a valid six-digit code.
 */
export function randomNumericCode(digits: number): string {
  const max = 10 ** digits;
  const limit = Math.floor(0xffffffff / max) * max;
  for (;;) {
    const n = randomBytes(4).readUInt32BE(0);
    if (n < limit) return String(n % max).padStart(digits, '0');
  }
}

/** Hash a client IP so the audit log never stores a raw address. */
export function hashIp(secret: string, ip: string | undefined): string | null {
  if (!ip) return null;
  return hmacHex(secret, `ip:${ip}`).slice(0, 32);
}
