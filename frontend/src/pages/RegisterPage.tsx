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
      <div className="flex min-h-screen items-center justify-center px-4">
        <GlassCard className="w-full max-w-sm">
          <TextReveal as="h1" className="mb-1 text-2xl">
            Create your account
          </TextReveal>
          <p className="mb-6 text-sm text-muted-foreground">
            Set up your gym's member portal.
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
