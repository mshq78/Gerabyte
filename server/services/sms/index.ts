import { env } from '../../config/env.js';
import { consoleSmsProvider } from './console.js';
import { kavenegarSmsProvider } from './kavenegar.js';

export interface SmsProvider {
  readonly name: string;
  /** Deliver a one-time code. Throws on a hard delivery failure. */
  sendOtp(phone: string, code: string): Promise<void>;
}

let provider: SmsProvider | null = null;

export function smsProvider(): SmsProvider {
  if (!provider) {
    provider = env().SMS_PROVIDER === 'kavenegar' ? kavenegarSmsProvider() : consoleSmsProvider();
  }
  return provider;
}

/** Test seam. */
export function setSmsProviderForTests(next: SmsProvider | null): void {
  provider = next;
}
