import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { GradientButton } from '../ui/GradientButton';
import { Input } from '../ui/Input';
import { useAuth } from '../../hooks/useAuth';
import type { AuthError } from './authError';
import { getAuthErrorMessage } from './authError';

/** Account creation form. Owns its own submit + error/loading/success state. */
export function RegisterForm() {
  const { register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await register({ email, password, full_name: fullName });
      setSuccess(true);
    } catch (err) {
      setError(
        getAuthErrorMessage(err as AuthError, 'Could not create your account. Please try again.'),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-emerald-600">Account created. You can now sign in.</p>
        <Link to="/login" className="text-center text-sm font-medium text-primary hover:underline">
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Full name"
        autoComplete="name"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        required
      />
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
        autoComplete="new-password"
        minLength={8}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <GradientButton type="submit" disabled={isSubmitting} className="mt-2 w-full">
        {isSubmitting ? 'Creating account...' : 'Create account'}
      </GradientButton>
    </form>
  );
}
