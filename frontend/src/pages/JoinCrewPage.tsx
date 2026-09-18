import { JoinCrewForm } from '../components/join/JoinCrewForm';
import { GlassCard } from '../components/ui/GlassCard';
import { PageWrapper } from '../components/ui/PageWrapper';
import { TextReveal } from '../components/ui/TextReveal';
import { PublicNavbar } from '../components/layout/PublicNavbar';

export default function JoinCrewPage() {
  return (
    <PageWrapper className="bg-gray-100">
      <PublicNavbar />
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-10">
        <img src="/brand/hsp-logo.png" alt="HSP — Harisportsperformance" className="h-24 w-auto rounded-xl" />
        <GlassCard className="w-full max-w-sm">
          <TextReveal as="h1" className="mb-1 text-2xl">
            Join the Crew
          </TextReveal>
          <p className="mb-6 text-sm text-muted-foreground">
            Tell us a bit about yourself and when's best to reach you — we'll
            call to get you started with Group'Dude.
          </p>
          <JoinCrewForm />
        </GlassCard>
      </div>
    </PageWrapper>
  );
}
