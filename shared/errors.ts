/**
 * Every error the API can return, shared by the server and the client.
 *
 * The code is a stable English identifier both sides branch on; the Persian
 * message is the only thing a user ever sees. Nothing here leaks whether an
 * account exists, which record was missing, or what the database said.
 */
export const ERROR_MESSAGES = {
  // Generic
  INTERNAL: 'خطایی رخ داد. لطفاً دوباره تلاش کنید.',
  BAD_REQUEST: 'درخواست نامعتبر است.',
  NOT_FOUND: 'موردی یافت نشد.',
  VALIDATION_FAILED: 'اطلاعات واردشده معتبر نیست.',

  // Auth / session
  UNAUTHENTICATED: 'برای ادامه باید وارد حساب کاربری شوید.',
  FORBIDDEN: 'به این بخش دسترسی ندارید',
  CSRF_FAILED: 'درخواست نامعتبر است.',
  SESSION_EXPIRED: 'نشست شما منقضی شده است. دوباره وارد شوید.',

  // Phone / OTP
  INVALID_PHONE: 'شماره موبایل وارد شده معتبر نیست.',
  INVALID_OTP_FORMAT: 'کد تایید باید ۶ رقم باشد.',
  OTP_INVALID: 'کد واردشده صحیح نیست.',
  OTP_EXPIRED: 'کد تایید منقضی شده است. کد تازه‌ای بخواهید.',
  OTP_TOO_MANY_ATTEMPTS: 'تعداد تلاش‌های مجاز برای این کد به پایان رسید. کد تازه‌ای بخواهید.',
  OTP_RESEND_COOLDOWN: 'برای دریافت کد تازه کمی صبر کنید.',

  // Passwords
  PASSWORD_TOO_SHORT: 'کلمه عبور باید حداقل ۸ نویسه باشد.',
  INVALID_CREDENTIALS: 'شماره موبایل یا کلمه عبور اشتباه است.',
  CURRENT_PASSWORD_REQUIRED: 'برای تغییر کلمه عبور، کلمه عبور فعلی را وارد کنید.',
  ACCOUNT_LOCKED: 'حساب شما موقتاً قفل شده است. بعداً دوباره تلاش کنید.',

  // Throttling
  RATE_LIMITED: 'تعداد درخواست‌ها بیش از حد مجاز است. کمی بعد دوباره تلاش کنید.',

  // Account state
  ACCOUNT_DISABLED: 'حساب کاربری شما غیرفعال شده است.',
  NAME_TOO_SHORT: 'نام و نام خانوادگی باید حداقل ۳ نویسه باشد.',
} as const;

export type ErrorCode = keyof typeof ERROR_MESSAGES;

export interface ApiErrorBody {
  error: { code: ErrorCode; message: string; requestId?: string; details?: unknown };
}
