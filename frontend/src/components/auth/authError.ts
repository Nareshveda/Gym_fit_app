import { isAxiosError } from 'axios';

/** Error value caught from an auth API call — narrowed internally. */
export type AuthError = unknown;

interface ApiErrorBody {
  // The app's own error envelope (see app.exceptions.app_exception_handler),
  // returned for e.g. 401 invalid credentials / 409 duplicate email.
  error?: { code: string; message: string };
  // FastAPI's built-in request-validation error shape (422), which bypasses
  // the app's custom handlers.
  detail?: string;
}

/**
 * Extract a user-facing message from a failed auth request, preferring
 * the backend's `{ error: { message } }` envelope (e.g. "An account with
 * this email already exists") and falling back to a generic message
 * otherwise.
 */
export function getAuthErrorMessage(error: AuthError, fallback: string): string {
  if (isAxiosError<ApiErrorBody>(error)) {
    const message = error.response?.data?.error?.message;
    if (typeof message === 'string' && message.length > 0) {
      return message;
    }
    const detail = error.response?.data?.detail;
    if (typeof detail === 'string' && detail.length > 0) {
      return detail;
    }
  }
  return fallback;
}
