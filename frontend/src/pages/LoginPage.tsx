import { Link } from 'react-router-dom';
import { LoginForm } from '../components/auth/LoginForm';
import { GlassCard } from '../components/ui/GlassCard';
import { PageWrapper } from '../components/ui/PageWrapper';
import { TextReveal } from '../components/ui/TextReveal';
import { PublicNavbar } from '../components/layout/PublicNavbar';

export default function LoginPage() {
  return (
    <PageWrapper className="bg-gray-100">
      <PublicNavbar />
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4">
        <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-primary">
          ← Back to Home
        </Link>
        <img src="/brand/hsp-logo.png" alt="HSP — Harisportsperformance" className="h-24 w-auto rounded-xl" />
        <GlassCard className="w-full max-w-sm">
          <TextReveal as="h1" className="mb-1 text-2xl">
            Welcome back
          </TextReveal>
          <p className="mb-6 text-sm text-muted-foreground">
            Sign in to manage your gym.
          </p>
          <LoginForm />
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account? Ask an owner or admin to set one up for you.
          </p>
        </GlassCard>
      </div>
    </PageWrapper>
  );
}
