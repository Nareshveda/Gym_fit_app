import { Link } from 'react-router-dom';
import { GlassCard } from '../components/ui/GlassCard';
import { PageWrapper } from '../components/ui/PageWrapper';
import { TextReveal } from '../components/ui/TextReveal';

/** Placeholder — the actual reset workflow (email/OTP, token, etc.) is not built yet. */
export default function ForgotPasswordPage() {
  return (
    <PageWrapper className="bg-gray-100">
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4">
        <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-primary">
          ← Back to Sign In
        </Link>
        <img src="/brand/hsp-logo.png" alt="HSP — Harisportsperformance" className="h-24 w-auto rounded-xl" />
        <GlassCard className="w-full max-w-sm text-center">
          <TextReveal as="h1" className="mb-2 text-2xl">
            Password reset
          </TextReveal>
          <p className="text-sm text-muted-foreground">
            This isn't set up yet. In the meantime, ask an owner or admin to reset your password for you.
          </p>
        </GlassCard>
      </div>
    </PageWrapper>
  );
}
