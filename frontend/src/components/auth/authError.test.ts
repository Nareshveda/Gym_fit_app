import { AxiosError, AxiosHeaders } from 'axios';
import { describe, expect, it } from 'vitest';
import { getAuthErrorMessage } from './authError';

function axiosErrorWithBody(status: number, data: unknown): AxiosError {
  return new AxiosError(
    'Request failed',
    String(status),
    undefined,
    undefined,
    {
      status,
      statusText: 'Error',
      headers: {},
      config: { headers: new AxiosHeaders() },
      data,
    } as never,
  );
}

describe('getAuthErrorMessage', () => {
  it('prefers the app error envelope ({ error: { message } })', () => {
    const error = axiosErrorWithBody(409, {
      error: { code: 'CONFLICT', message: 'An account with this email already exists' },
    });
    expect(getAuthErrorMessage(error, 'fallback')).toBe(
      'An account with this email already exists',
    );
  });

  it('falls back to FastAPI-style { detail } when present', () => {
    const error = axiosErrorWithBody(422, { detail: 'Malformed request' });
    expect(getAuthErrorMessage(error, 'fallback')).toBe('Malformed request');
  });

  it('returns the fallback when the response body has neither shape', () => {
    const error = axiosErrorWithBody(500, {});
    expect(getAuthErrorMessage(error, 'fallback')).toBe('fallback');
  });

  it('returns the fallback for a non-axios error', () => {
    expect(getAuthErrorMessage(new Error('boom'), 'fallback')).toBe('fallback');
  });
});
