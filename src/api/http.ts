import { ERROR_MESSAGES, type ErrorCode } from '../../shared/errors';

/**
 * The single door to the API.
 *
 * Same-origin only, cookies always, the CSRF header on every request, and one
 * place that turns an error body into the Persian sentence a user sees.
 */
const CSRF_HEADER = 'X-Requested-With';
const CSRF_VALUE = 'gerabyte';

export class ApiError extends Error {
  readonly status: number;
  readonly code: ErrorCode | 'NETWORK';
  readonly requestId?: string;
  readonly retryAfterSeconds?: number;

  constructor(
    status: number,
    code: ErrorCode | 'NETWORK',
    message: string,
    extra: { requestId?: string; retryAfterSeconds?: number } = {}
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    if (extra.requestId) this.requestId = extra.requestId;
    if (extra.retryAfterSeconds !== undefined) this.retryAfterSeconds = extra.retryAfterSeconds;
  }
}

type UnauthorizedHandler = () => void;

let onUnauthorized: UnauthorizedHandler = () => {};

/**
 * Called when the server says the session is gone. The app registers a handler
 * that clears local state and sends the user to /login.
 */
export function setUnauthorizedHandler(handler: UnauthorizedHandler): void {
  onUnauthorized = handler;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  signal?: AbortSignal;
  /** Set for the login routes, where a 401 is an answer rather than a logout. */
  allowUnauthenticated?: boolean;
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = path.startsWith('/api') ? path : `/api${path}`;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

function messageForCode(code: string | undefined, fallback: string): string {
  if (code && code in ERROR_MESSAGES) return ERROR_MESSAGES[code as ErrorCode];
  return fallback;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, query, signal, allowUnauthenticated = false } = options;

  const headers: Record<string, string> = { Accept: 'application/json' };
  // Sent on every request, not just writes: the server checks it on writes, and
  // a uniform client is easier to reason about than a conditional one.
  headers[CSRF_HEADER] = CSRF_VALUE;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers,
      // Same-origin: the cookie is sent, and nothing is sent anywhere else.
      credentials: 'same-origin',
      body: body === undefined ? undefined : JSON.stringify(body),
      ...(signal ? { signal } : {}),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ApiError(0, 'NETWORK', 'ارتباط با سرور برقرار نشد. اتصال خود را بررسی کنید.');
  }

  if (response.status === 204) return undefined as T;

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const payload: unknown = isJson ? await response.json().catch(() => null) : null;

  if (response.ok) return payload as T;

  const errorBody = (payload as { error?: { code?: string; message?: string; requestId?: string } })
    ?.error;
  const code = (errorBody?.code ?? 'INTERNAL') as ErrorCode;
  const message = messageForCode(errorBody?.code, errorBody?.message ?? ERROR_MESSAGES.INTERNAL);

  const retryAfter = response.headers.get('retry-after');
  const apiError = new ApiError(response.status, code, message, {
    ...(errorBody?.requestId ? { requestId: errorBody.requestId } : {}),
    ...(retryAfter ? { retryAfterSeconds: Number(retryAfter) } : {}),
  });

  // A 401 anywhere but the login routes means the session is gone: drop local
  // state and send the user to sign in again.
  if (response.status === 401 && !allowUnauthenticated) onUnauthorized();

  throw apiError;
}

export const http = {
  get: <T>(path: string, options: Omit<RequestOptions, 'method' | 'body'> = {}) =>
    apiRequest<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options: Omit<RequestOptions, 'method'> = {}) =>
    apiRequest<T>(path, { ...options, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, options: Omit<RequestOptions, 'method'> = {}) =>
    apiRequest<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options: Omit<RequestOptions, 'method' | 'body'> = {}) =>
    apiRequest<T>(path, { ...options, method: 'DELETE' }),
};
