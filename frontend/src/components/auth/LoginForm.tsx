import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GradientButton } from '../ui/GradientButton';
import { Input } from '../ui/Input';
import { useAuth } from '../../hooks/useAuth';
import type { AuthError } from './authError';
import { getAuthErrorMessage } from './authError';

/** Email/password sign-in form. Owns its own submit + error/loading state. */
export function LoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const me = await login({ email, password });
      navigate(me.actor === 'member' ? '/portal' : '/dashboard');
    } catch (err) {
      setError(getAuthErrorMessage(err as AuthError, 'Invalid email or password.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Input
        label="Password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <Link to="/forgot-password" className="-mt-2 self-end text-sm text-primary hover:underline">
        Forgot password?
      </Link>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <GradientButton type="submit" disabled={isSubmitting} className="mt-2 w-full">
        {isSubmitting ? 'Signing in...' : 'Sign in'}
      </GradientButton>
    </form>
  );
}
