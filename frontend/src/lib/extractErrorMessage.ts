import { isAxiosError } from 'axios';

interface FastApiValidationErrorItem {
  msg?: string;
  loc?: (string | number)[];
}

/**
 * Extracts a human-readable message from an API error response.
 *
 * The backend uses two different shapes depending on where the error
 * originates: our own `AppException` handler returns
 * `{ error: { code, message } }`, while FastAPI's built-in request
 * validation (422s Pydantic rejects, e.g. a malformed field) returns
 * `{ detail: [{ msg, loc }, ...] }` — an *array*, not a string. Treating
 * `detail` as always-a-string (as several pages used to) meant a validation
 * failure rendered no visible message at all instead of an error banner,
 * which is exactly what made the member-edit "nothing happens on save" bug
 * so hard to spot: the request was failing with 422, just silently.
 */
export function extractErrorMessage(error: unknown, fallback: string): string {
  if (!isAxiosError(error)) return fallback;

  const data = error.response?.data as
    | { error?: { message?: string }; detail?: string | FastApiValidationErrorItem[] }
    | undefined;

  if (typeof data?.error?.message === 'string') return data.error.message;

  if (typeof data?.detail === 'string') return data.detail;

  if (Array.isArray(data?.detail)) {
    const messages = data.detail
      .map((item) => {
        const field = item.loc?.[item.loc.length - 1];
        return item.msg && field ? `${field}: ${item.msg}` : item.msg;
      })
      .filter((msg): msg is string => Boolean(msg));
    if (messages.length > 0) return messages.join('; ');
  }

  return fallback;
}
