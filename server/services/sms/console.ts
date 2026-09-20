import { logger } from '../../logger.js';
import type { SmsProvider } from './index.js';

/**
 * Development provider: prints the code to the server log instead of sending it.
 *
 * The logger redacts `code`, so the code is written as a distinct field name the
 * redaction list does not cover — deliberate, and the reason env validation
 * refuses to boot production with SMS_PROVIDER=console.
 */
export function consoleSmsProvider(): SmsProvider {
  return {
    name: 'console',
    async sendOtp(phone, code) {
      const tail = phone.slice(-4);
      logger.info({ devOtp: code, phoneTail: tail }, 'DEV OTP issued (console provider)');
    },
  };
}
