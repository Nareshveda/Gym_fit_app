import axios, {
  type AxiosError,
  type InternalAxiosRequestConfig,
} from 'axios';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

/** Axios request config extended with a retry marker to avoid refresh loops. */
interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
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

// On a 401, attempt a one-time token refresh; otherwise send the user
// back to /login. Refined further once the auth module lands.
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

      if (refreshToken) {
        try {
          const { data } = await axios.post<{
            access_token: string;
            refresh_token: string;
          }>(`${import.meta.env.VITE_API_URL}/api/v1/auth/refresh`, {
            refresh_token: refreshToken,
          });

          localStorage.setItem(ACCESS_TOKEN_KEY, data.access_token);
          localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token);

          return api(originalRequest);
        } catch (refreshError) {
          localStorage.removeItem(ACCESS_TOKEN_KEY);
          localStorage.removeItem(REFRESH_TOKEN_KEY);
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
