import { env } from '../../config/env.js';
import { logger } from '../../logger.js';
import type { SmsProvider } from './index.js';

/**
 * Kavenegar Verify Lookup. Lookup is the right endpoint for OTP: the body is a
 * pre-approved template, so the code is the only variable part and the message
 * is not subject to general SMS filtering.
 *
 * Outbound calls from a Vercel function to an Iranian provider have to be
 * proven early — see docs/RUNBOOK.md.
 */
const TIMEOUT_MS = 8000;

export function kavenegarSmsProvider(): SmsProvider {
  return {
    name: 'kavenegar',
    async sendOtp(phone, code) {
      const { KAVENEGAR_API_KEY, KAVENEGAR_OTP_TEMPLATE } = env();
      if (!KAVENEGAR_API_KEY) throw new Error('KAVENEGAR_API_KEY is not configured');

      // Kavenegar expects the national form: 09XXXXXXXXX.
      const receptor = phone.startsWith('+98') ? `0${phone.slice(3)}` : phone;
      const url = new URL(`https://api.kavenegar.com/v1/${KAVENEGAR_API_KEY}/verify/lookup.json`);
      url.searchParams.set('receptor', receptor);
      url.searchParams.set('token', code);
      url.searchParams.set('template', KAVENEGAR_OTP_TEMPLATE ?? 'gerabyte-otp');

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
      try {
        const response = await fetch(url, { method: 'GET', signal: controller.signal });
        if (!response.ok) {
          // Never log the URL: it carries both the API key and the code.
          logger.error({ status: response.status }, 'kavenegar rejected an OTP send');
          throw new Error(`kavenegar responded ${response.status}`);
        }
        const payload = (await response.json()) as { return?: { status?: number } };
        const status = payload.return?.status;
        if (status !== 200) {
          logger.error({ providerStatus: status }, 'kavenegar returned a non-200 status');
          throw new Error(`kavenegar status ${status}`);
        }
      } finally {
        clearTimeout(timer);
      }
    },
  };
}
