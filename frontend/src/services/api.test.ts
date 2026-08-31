import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AxiosError } from 'axios';

// `api.ts` calls `axios.create()` once at module load time and keeps that
// instance for the lifetime of the app, so the mock instance must be a
// callable function (real axios instances are callable, e.g. `api(config)`
// retries a request) with `.interceptors` attached, and we capture whatever
// handlers `api.ts` registers so tests can invoke them directly.
const requestInterceptor = vi.fn();
const responseFulfilled = vi.fn();
const responseRejected = vi.fn();
const instanceCall = vi.fn().mockResolvedValue({ data: 'retried' });
const axiosPost = vi.fn();

vi.mock('axios', () => {
  function isAxiosError(value: unknown): boolean {
    return Boolean(value && typeof value === 'object' && 'isAxiosError' in value);
  }

  return {
    default: {
      create: () =>
        Object.assign(instanceCall, {
          interceptors: {
            request: { use: requestInterceptor },
            response: { use: (fulfilled: unknown, rejected: unknown) => {
              responseFulfilled(fulfilled);
              responseRejected(rejected);
            } },
          },
        }),
      post: axiosPost,
      isAxiosError,
    },
    isAxiosError,
  };
});

function make401(originalRequest: { _retry?: boolean }): AxiosError {
  return {
    isAxiosError: true,
    response: { status: 401 },
    config: originalRequest,
    name: 'AxiosError',
    message: 'Request failed with status code 401',
    toJSON: () => ({}),
  } as unknown as AxiosError;
}

function makeNetworkError(originalRequest: { _networkRetryCount?: number }): AxiosError {
  return {
    isAxiosError: true,
    response: undefined,
    code: 'ERR_NETWORK',
    config: originalRequest,
    name: 'AxiosError',
    message: 'Network Error',
    toJSON: () => ({}),
  } as unknown as AxiosError;
}

function makeServerError(originalRequest: object): AxiosError {
  return {
    isAxiosError: true,
    response: { status: 500 },
    config: originalRequest,
    name: 'AxiosError',
    message: 'Request failed with status code 500',
    toJSON: () => ({}),
  } as unknown as AxiosError;
}

describe('api response interceptor — refresh token race', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    instanceCall.mockResolvedValue({ data: 'retried' });
    localStorage.clear();
    localStorage.setItem('access_token', 'stale-access');
    localStorage.setItem('refresh_token', 'the-refresh-token');
    // Re-import so the module (and its interceptor registration) runs fresh
    // against the mocked axios for each test.
    vi.resetModules();
    await import('./api');
  });

  it('shares a single in-flight refresh call across concurrent 401s instead of spending the rotating refresh token twice', async () => {
    let resolveRefresh!: (value: { data: { access_token: string; refresh_token: string } }) => void;
    axiosPost.mockReturnValue(
      new Promise((resolve) => {
        resolveRefresh = resolve;
      }),
    );

    const rejectedHandler = responseRejected.mock.calls[0][0] as (
      error: AxiosError,
    ) => Promise<unknown>;

    // Two requests fail with 401 "at the same time" — e.g. a page firing
    // several API calls right as the access token expires.
    const requestA = { _retry: false };
    const requestB = { _retry: false };
    const resultA = rejectedHandler(make401(requestA));
    const resultB = rejectedHandler(make401(requestB));

    // Only one refresh call should ever be in flight, no matter how many
    // requests hit the 401 handler before it resolves.
    expect(axiosPost).toHaveBeenCalledTimes(1);

    resolveRefresh({
      data: { access_token: 'new-access', refresh_token: 'new-refresh' },
    });
    await Promise.all([resultA, resultB]);

    expect(axiosPost).toHaveBeenCalledTimes(1);
    expect(instanceCall).toHaveBeenCalledTimes(2);
    expect(localStorage.getItem('access_token')).toBe('new-access');
    expect(localStorage.getItem('refresh_token')).toBe('new-refresh');
  });

  it('logs both waiters out if the shared refresh call fails, without spending a second refresh attempt', async () => {
    let rejectRefresh!: (reason: unknown) => void;
    axiosPost.mockReturnValue(
      new Promise((_resolve, reject) => {
        rejectRefresh = reject;
      }),
    );

    const rejectedHandler = responseRejected.mock.calls[0][0] as (
      error: AxiosError,
    ) => Promise<unknown>;

    const requestA = { _retry: false };
    const requestB = { _retry: false };
    const resultA = rejectedHandler(make401(requestA));
    const resultB = rejectedHandler(make401(requestB));

    rejectRefresh(Object.assign(new Error('revoked'), { isAxiosError: true }));

    await expect(resultA).rejects.toBeTruthy();
    await expect(resultB).rejects.toBeTruthy();

    expect(axiosPost).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
  });

  it('does not log out a valid session when a different tab already rotated the refresh token before this failure was handled', async () => {
    // localStorage is shared across every tab on the origin. Simulates: a
    // stale background tab (holding an old, already-dead refresh token)
    // fires a request right after this tab logged in fresh and rotated to
    // a new token pair — the stale tab's refresh attempt fails, but it must
    // not clobber the newer, valid tokens this tab just stored.
    let rejectRefresh!: (reason: unknown) => void;
    axiosPost.mockReturnValue(
      new Promise((_resolve, reject) => {
        rejectRefresh = reject;
      }),
    );

    const rejectedHandler = responseRejected.mock.calls[0][0] as (
      error: AxiosError,
    ) => Promise<unknown>;

    const requestA = { _retry: false };
    const resultA = rejectedHandler(make401(requestA));

    // Another tab's successful refresh lands while ours is still in flight.
    localStorage.setItem('access_token', 'access-from-other-tab');
    localStorage.setItem('refresh_token', 'refresh-from-other-tab');

    rejectRefresh(Object.assign(new Error('revoked'), { isAxiosError: true }));
    await resultA;

    expect(localStorage.getItem('access_token')).toBe('access-from-other-tab');
    expect(localStorage.getItem('refresh_token')).toBe('refresh-from-other-tab');
    expect(instanceCall).toHaveBeenCalledTimes(1);
  });
});

describe('api response interceptor — transient network failures', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    instanceCall.mockResolvedValue({ data: 'retried' });
    localStorage.clear();
    vi.resetModules();
    await import('./api');
  });

  it('quietly retries a request that got no response at all, after a short delay', async () => {
    vi.useFakeTimers();
    try {
      const rejectedHandler = responseRejected.mock.calls[0][0] as (
        error: AxiosError,
      ) => Promise<unknown>;

      const originalRequest = {};
      const resultPromise = rejectedHandler(makeNetworkError(originalRequest));

      // Hasn't retried yet — it's waiting out the backoff delay first.
      expect(instanceCall).not.toHaveBeenCalled();

      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result).toEqual({ data: 'retried' });
      expect(instanceCall).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not retry or delay a real HTTP error response (e.g. a 500)', async () => {
    const rejectedHandler = responseRejected.mock.calls[0][0] as (
      error: AxiosError,
    ) => Promise<unknown>;

    const error = makeServerError({});
    await expect(rejectedHandler(error)).rejects.toBe(error);
    expect(instanceCall).not.toHaveBeenCalled();
  });
});
