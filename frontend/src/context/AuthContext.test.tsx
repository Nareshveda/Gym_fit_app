import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authService } from '../services/authService';
import { AuthProvider, useAuth } from './AuthContext';

vi.mock('../services/authService', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    me: vi.fn(),
    updateProfile: vi.fn(),
    logout: vi.fn(),
  },
}));

const mockedAuthService = vi.mocked(authService, true);

const user = {
  id: '1',
  email: 'user@example.com',
  full_name: 'Test User',
  role: 'staff' as const,
  is_active: true,
  created_at: '2026-01-01T00:00:00Z',
  actor: 'staff' as const,
};

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe('AuthProvider', () => {
  it('starts unauthenticated with no stored token', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(mockedAuthService.me).not.toHaveBeenCalled();
  });

  it('resolves the session from a stored token on mount', async () => {
    localStorage.setItem('access_token', 'stored-token');
    mockedAuthService.me.mockResolvedValue(user);

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(user);
  });

  it('login stores both tokens and loads the profile', async () => {
    mockedAuthService.login.mockResolvedValue({
      access_token: 'access-1',
      refresh_token: 'refresh-1',
      token_type: 'bearer',
    });
    mockedAuthService.me.mockResolvedValue(user);

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.login({ email: 'user@example.com', password: 'secret123' });
    });

    expect(localStorage.getItem('access_token')).toBe('access-1');
    expect(localStorage.getItem('refresh_token')).toBe('refresh-1');
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(user);
  });

  it('logout clears tokens and the current user', async () => {
    localStorage.setItem('access_token', 'stored-token');
    localStorage.setItem('refresh_token', 'stored-refresh');
    mockedAuthService.me.mockResolvedValue(user);
    mockedAuthService.logout.mockResolvedValue(undefined);

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

    await act(async () => {
      await result.current.logout();
    });

    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('register does not implicitly log the new user in', async () => {
    mockedAuthService.register.mockResolvedValue(user);

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.register({
        email: 'user@example.com',
        password: 'secret123',
        full_name: 'Test User',
      });
    });

    expect(localStorage.getItem('access_token')).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('useAuth throws when used outside AuthProvider', () => {
    expect(() => renderHook(() => useAuth())).toThrow(/must be used within an AuthProvider/);
  });
});
