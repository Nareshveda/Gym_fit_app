import { Link } from 'react-router-dom';
import { GradientButton } from '../components/ui/GradientButton';
import { PageWrapper } from '../components/ui/PageWrapper';
import { TextReveal } from '../components/ui/TextReveal';

export default function NotFoundPage() {
  return (
    <PageWrapper>
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <TextReveal as="h1" className="text-4xl">
          404
        </TextReveal>
        <p className="text-muted-foreground">This page doesn't exist.</p>
        <Link to="/dashboard">
          <GradientButton type="button">Back to dashboard</GradientButton>
        </Link>
      </div>
    </PageWrapper>
  );
}
