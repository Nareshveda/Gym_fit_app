import api from './api';
import type {
  AuthUser,
  LoginPayload,
  RegisterPayload,
  TokenResponse,
  UpdateProfilePayload,
} from '../types/auth';

/** Auth API calls against `/api/v1/auth/*`. */
export const authService = {
  async login(payload: LoginPayload): Promise<TokenResponse> {
    // Backend expects a JSON body ({ email, password }), not an OAuth2 form.
    const { data } = await api.post<TokenResponse>('/auth/login', payload);
    return data;
  },

  async register(payload: RegisterPayload): Promise<AuthUser> {
    const { data } = await api.post<AuthUser>('/auth/register', payload);
    return data;
  },

  async me(): Promise<AuthUser> {
    const { data } = await api.get<AuthUser>('/auth/me');
    return data;
  },

  async updateProfile(payload: UpdateProfilePayload): Promise<AuthUser> {
    const { data } = await api.put<AuthUser>('/auth/me', payload);
    return data;
  },

  /** Upload (or replace) the current actor's own profile picture — .jpg/.jpeg/.png, up to 10 MB. */
  async uploadAvatar(file: File): Promise<AuthUser> {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post<AuthUser>('/auth/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch {
      // Best-effort — the caller clears local session state regardless
      // of whether the server-side logout call succeeds.
    }
  },
};
