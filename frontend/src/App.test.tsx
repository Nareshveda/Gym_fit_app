import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('App', () => {
  it('redirects an unauthenticated visitor to the login page', async () => {
    render(<App />);
    expect(await screen.findByText(/welcome back/i)).toBeInTheDocument();
  });
});
