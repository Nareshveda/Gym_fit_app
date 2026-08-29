import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AxiosError, AxiosHeaders } from 'axios';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { useAuth } from '../../hooks/useAuth';
import { LoginForm } from './LoginForm';

vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

const mockedUseAuth = vi.mocked(useAuth);

function renderLoginForm() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        <Route path="/dashboard" element={<div>Dashboard home</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

function fillAndSubmit(email: string, password: string) {
  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: email } });
  fireEvent.change(screen.getByLabelText(/password/i), { target: { value: password } });
  fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
}

describe('LoginForm', () => {
  it('logs in with the entered credentials and navigates to /dashboard', async () => {
    const login = vi.fn().mockResolvedValue(undefined);
    mockedUseAuth.mockReturnValue({ login } as unknown as ReturnType<typeof useAuth>);

    renderLoginForm();
    fillAndSubmit('user@example.com', 'secret123');

    await waitFor(() =>
      expect(login).toHaveBeenCalledWith({ email: 'user@example.com', password: 'secret123' }),
    );
    expect(await screen.findByText('Dashboard home')).toBeInTheDocument();
  });

  it('shows the backend error message when login fails', async () => {
    const error = new AxiosError('Request failed', '401', undefined, undefined, {
      status: 401,
      statusText: 'Unauthorized',
      headers: {},
      config: { headers: new AxiosHeaders() },
      data: { error: { code: 'UNAUTHORIZED', message: 'Invalid email or password' } },
    } as never);
    const login = vi.fn().mockRejectedValue(error);
    mockedUseAuth.mockReturnValue({ login } as unknown as ReturnType<typeof useAuth>);

    renderLoginForm();
    fillAndSubmit('user@example.com', 'wrong-password');

    expect(await screen.findByText('Invalid email or password')).toBeInTheDocument();
  });
});
