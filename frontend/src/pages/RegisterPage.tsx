import { Link } from 'react-router-dom';
import { RegisterForm } from '../components/auth/RegisterForm';
import { GlassCard } from '../components/ui/GlassCard';
import { PageWrapper } from '../components/ui/PageWrapper';
import { TextReveal } from '../components/ui/TextReveal';
import { MeshBackground } from '../components/layout/MeshBackground';

export default function RegisterPage() {
  return (
    <PageWrapper>
      <MeshBackground />
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4">
        <img src="/brand/hsp-logo.png" alt="HSP — Harisportsperformance" className="h-24 w-auto rounded-xl" />
        <GlassCard className="w-full max-w-sm">
          <TextReveal as="h1" className="mb-1 text-2xl">
            Set up your gym
          </TextReveal>
          <p className="mb-6 text-sm text-muted-foreground">
            One-time setup for a brand-new gym — this creates the owner account.
            If your gym already has an account, ask an owner or admin to add
            you instead.
          </p>
          <RegisterForm />
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </GlassCard>
      </div>
    </PageWrapper>
  );
}
