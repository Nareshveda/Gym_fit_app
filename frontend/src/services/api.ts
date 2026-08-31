import axios, {
  type AxiosError,
  type InternalAxiosRequestConfig,
} from 'axios';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

/** Axios request config extended with retry markers (auth refresh, network blips). */
interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
  _networkRetryCount?: number;
}

const MAX_NETWORK_RETRIES = 2;
const NETWORK_RETRY_DELAY_MS = 400;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach the JWT access token to every outgoing request, when present.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Refresh tokens are single-use/rotating (the backend revokes the old one on
// every call). A page frequently fires several requests at once, so once the
// access token expires, they'd all land here together and each independently
// try to spend the same refresh token — only the first succeeds, and every
// other one gets "Refresh token has been revoked or does not exist" even
// though the session is perfectly valid. Sharing a single in-flight refresh
// call across concurrent 401s (instead of one per request) is what fixes it.
let refreshPromise: Promise<void> | null = null;

async function refreshAccessToken(): Promise<void> {
  const refreshTokenAtStart = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshTokenAtStart) throw new Error('No refresh token available');

  try {
    const { data } = await axios.post<{
      access_token: string;
      refresh_token: string;
    }>(`${import.meta.env.VITE_API_URL}/api/v1/auth/refresh`, {
      refresh_token: refreshTokenAtStart,
    });

    localStorage.setItem(ACCESS_TOKEN_KEY, data.access_token);
    localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token);
  } catch (err) {
    // localStorage is shared across every tab on this origin. If a
    // *different* tab (an old one left open from an earlier login, say)
    // already replaced this exact refresh token by the time this call
    // failed, someone else's refresh already succeeded in the meantime —
    // that session is still valid, so only clear it out when the token
    // we attempted with is still the one sitting in storage.
    if (localStorage.getItem(REFRESH_TOKEN_KEY) === refreshTokenAtStart) {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
    throw err;
  }
}

// On a 401, attempt a one-time token refresh; otherwise send the user
// back to /login. Refined further once the auth module lands.
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    // A request that got no response at all (dropped connection, tunnel
    // hiccup) rather than an HTTP error is usually just a transient blip —
    // a quiet, short-backoff retry clears most of these before the user
    // ever sees an error banner. Distinct from the 401/refresh handling
    // below, which is about an HTTP response we did receive.
    if (!error.response && originalRequest && error.code !== 'ERR_CANCELED') {
      const retryCount = originalRequest._networkRetryCount ?? 0;
      if (retryCount < MAX_NETWORK_RETRIES) {
        originalRequest._networkRetryCount = retryCount + 1;
        await delay(NETWORK_RETRY_DELAY_MS * (retryCount + 1));
        return api(originalRequest);
      }
    }

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

      if (refreshToken) {
        try {
          if (!refreshPromise) {
            refreshPromise = refreshAccessToken().finally(() => {
              refreshPromise = null;
            });
          }
          await refreshPromise;

          return api(originalRequest);
        } catch (refreshError) {
          // refreshAccessToken() only clears storage when the refresh it
          // attempted turned out to still be current (see there for why).
          // So if there's still an access token sitting in storage now,
          // this failure was stale — e.g. another tab's refresh already
          // replaced it — and the session is actually fine; just retry.
          if (localStorage.getItem(ACCESS_TOKEN_KEY)) {
            return api(originalRequest);
          }

          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }

      window.location.href = '/login';
    }

    return Promise.reject(error);
  },
);

export default api;
