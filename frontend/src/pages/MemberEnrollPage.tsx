import axios from 'axios';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MemberForm, type MemberFormValues } from '../components/members/MemberForm';
import { GlassCard } from '../components/ui/GlassCard';
import { PageWrapper } from '../components/ui/PageWrapper';
import { TextReveal } from '../components/ui/TextReveal';
import { memberService } from '../services/memberService';

function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = (error.response?.data as { detail?: string } | undefined)?.detail;
    return detail ?? error.message;
  }
  return 'Something went wrong. Please try again.';
}

export default function MemberEnrollPage() {
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (values: MemberFormValues) => {
    setSubmitError(null);
    try {
      const created = await memberService.create(values);
      navigate(`/members/${created.id}`);
    } catch (err) {
      setSubmitError(extractErrorMessage(err));
    }
  };

  return (
    <PageWrapper>
      <TextReveal as="h1" className="mb-6 text-2xl">
        Enroll Member
      </TextReveal>
      <GlassCard>
        <MemberForm
          mode="create"
          onSubmit={handleSubmit}
          onCancel={() => navigate('/members')}
          submitError={submitError}
        />
      </GlassCard>
    </PageWrapper>
  );
}
