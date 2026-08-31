import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import App from './App';

describe('App', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/');
  });

  it('renders the public home page at "/" without requiring authentication', async () => {
    render(<App />);
    expect(await screen.findByText(/progress you can see/i)).toBeInTheDocument();
  });

  it('redirects an unauthenticated visitor away from a protected route', async () => {
    window.history.pushState({}, '', '/dashboard');
    render(<App />);
    expect(await screen.findByText(/welcome back/i)).toBeInTheDocument();
  });
});
