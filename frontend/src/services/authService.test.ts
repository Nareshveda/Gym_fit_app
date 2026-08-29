import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from './api';
import { authService } from './authService';

vi.mock('./api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
  },
}));

const mockedApi = vi.mocked(api, true);

describe('authService.login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('posts a JSON body matching the backend LoginRequest schema (email/password)', async () => {
    mockedApi.post.mockResolvedValue({
      data: { access_token: 'a', refresh_token: 'r', token_type: 'bearer' },
    });

    await authService.login({ email: 'user@example.com', password: 'secret123' });

    expect(mockedApi.post).toHaveBeenCalledWith('/auth/login', {
      email: 'user@example.com',
      password: 'secret123',
    });
  });

  it('does not send an x-www-form-urlencoded body (backend expects JSON, not an OAuth2 form)', async () => {
    mockedApi.post.mockResolvedValue({
      data: { access_token: 'a', refresh_token: 'r', token_type: 'bearer' },
    });

    await authService.login({ email: 'user@example.com', password: 'secret123' });

    const [, body, config] = mockedApi.post.mock.calls[0];
    expect(body).not.toBeInstanceOf(URLSearchParams);
    expect(config?.headers?.['Content-Type']).not.toBe('application/x-www-form-urlencoded');
  });
});
