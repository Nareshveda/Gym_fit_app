import { Link } from 'react-router-dom';
import { LoginForm } from '../components/auth/LoginForm';
import { GlassCard } from '../components/ui/GlassCard';
import { PageWrapper } from '../components/ui/PageWrapper';
import { TextReveal } from '../components/ui/TextReveal';
import { MeshBackground } from '../components/layout/MeshBackground';

export default function LoginPage() {
  return (
    <PageWrapper>
      <MeshBackground />
      <div className="flex min-h-screen items-center justify-center px-4">
        <GlassCard className="w-full max-w-sm">
          <TextReveal as="h1" className="mb-1 text-2xl">
            Welcome back
          </TextReveal>
          <p className="mb-6 text-sm text-muted-foreground">
            Sign in to manage your gym.
          </p>
          <LoginForm />
          <p className="mt-6 text-center text-sm text-muted-foreground">
            No account?{' '}
            <Link to="/register" className="font-medium text-primary hover:underline">
              Create one
            </Link>
          </p>
        </GlassCard>
      </div>
    </PageWrapper>
  );
}
