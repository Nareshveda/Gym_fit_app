import { LoginForm } from '../components/auth/LoginForm';
import { GlassCard } from '../components/ui/GlassCard';
import { PageWrapper } from '../components/ui/PageWrapper';
import { TextReveal } from '../components/ui/TextReveal';
import { MeshBackground } from '../components/layout/MeshBackground';

export default function LoginPage() {
  return (
    <PageWrapper>
      <MeshBackground />
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4">
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
