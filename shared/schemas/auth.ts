import { z } from 'zod';
import { phoneSchema } from './common.js';

export const OTP_LENGTH = 6;
export const otpCodeSchema = z
  .string()
  .trim()
  .regex(new RegExp(`^\\d{${OTP_LENGTH}}$`), 'INVALID_OTP_FORMAT');

export const MIN_PASSWORD_LENGTH = 8;
export const passwordSchema = z.string().min(MIN_PASSWORD_LENGTH, 'PASSWORD_TOO_SHORT').max(200);

export const otpRequestSchema = z.object({ phone: phoneSchema });
export type OtpRequestInput = z.infer<typeof otpRequestSchema>;

export const otpVerifySchema = z.object({
  phone: phoneSchema,
  codeId: z.uuid(),
  code: otpCodeSchema,
});
export type OtpVerifyInput = z.infer<typeof otpVerifySchema>;

export const passwordLoginSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(1).max(200),
});
export type PasswordLoginInput = z.infer<typeof passwordLoginSchema>;

export const setPasswordSchema = z.object({
  currentPassword: z.string().min(1).max(200).optional(),
  newPassword: passwordSchema,
});
export type SetPasswordInput = z.infer<typeof setPasswordSchema>;

/**
 * The OTP request response is deliberately identical whether or not an account
 * exists. `codeId` is an opaque handle for the verify call, never the code.
 */
export interface OtpRequestResult {
  codeId: string;
  expiresInSeconds: number;
  resendAfterSeconds: number;
}
