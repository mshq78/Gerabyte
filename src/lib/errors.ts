/**
 * Extract a user-facing message from an unknown thrown value.
 * `catch` bindings are `unknown`; the API layer throws `Error` with a Persian message.
 */
export function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return '';
}
