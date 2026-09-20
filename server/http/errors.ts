/**
 * Every error the API can return.
 *
 * The code is a stable English identifier the client can branch on; the Persian
 * message is the only thing a user sees. Nothing here leaks whether an account
 * exists, which record was missing, or what the database said.
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

export class AppError extends Error {
  readonly status: number;
  readonly code: ErrorCode;
  readonly details?: unknown;
  readonly headers?: Record<string, string>;

  constructor(
    status: number,
    code: ErrorCode,
    options: { details?: unknown; headers?: Record<string, string> } = {}
  ) {
    super(code);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    if (options.details !== undefined) this.details = options.details;
    if (options.headers) this.headers = options.headers;
  }
}

export const badRequest = (code: ErrorCode = 'BAD_REQUEST', details?: unknown) =>
  new AppError(400, code, { details });
export const unauthenticated = (code: ErrorCode = 'UNAUTHENTICATED') => new AppError(401, code);
export const forbidden = (code: ErrorCode = 'FORBIDDEN') => new AppError(403, code);

/**
 * Anything a caller is not allowed to see reads as "not found", so a 403 never
 * confirms that a record exists in an organization they cannot reach.
 */
export const notFound = (code: ErrorCode = 'NOT_FOUND') => new AppError(404, code);

export const rateLimited = (retryAfterSeconds: number) =>
  new AppError(429, 'RATE_LIMITED', {
    headers: { 'Retry-After': String(Math.max(1, Math.ceil(retryAfterSeconds))) },
  });

export function messageFor(code: ErrorCode): string {
  return ERROR_MESSAGES[code] ?? ERROR_MESSAGES.INTERNAL;
}
