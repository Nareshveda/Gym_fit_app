import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { MemberForm, type MemberFormValues } from '../components/members/MemberForm';
import { Button } from '../components/ui/Button';
import { GlassCard } from '../components/ui/GlassCard';
import { PageWrapper } from '../components/ui/PageWrapper';
import { TextReveal } from '../components/ui/TextReveal';
import { extractErrorMessage } from '../lib/extractErrorMessage';
import { memberService } from '../services/memberService';
import type { Member } from '../types/member';

const GENERIC_ERROR = 'Something went wrong. Please try again.';

export default function MemberEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [member, setMember] = useState<Member | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const loadMember = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await memberService.get(id);
      setMember(data);
    } catch (err) {
      setLoadError(extractErrorMessage(err, GENERIC_ERROR));
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadMember();
  }, [loadMember]);

  const handleSubmit = async (values: MemberFormValues) => {
    if (!id) return;
    setSubmitError(null);
    try {
      await memberService.update(id, values);
      navigate(`/members/${id}`);
    } catch (err) {
      setSubmitError(extractErrorMessage(err, GENERIC_ERROR));
    }
  };

  return (
    <PageWrapper>
      <div className="mb-6 flex items-center justify-between gap-4">
        <TextReveal as="h1" className="text-2xl">
          Edit Member
        </TextReveal>
        <Link
          to={id ? `/members/${id}` : '/members'}
          className="text-sm font-medium text-primary hover:underline"
        >
          Back to Member
        </Link>
      </div>

      {isLoading && (
        <GlassCard>
          <p className="text-muted-foreground">Loading member...</p>
        </GlassCard>
      )}

      {!isLoading && loadError && (
        <GlassCard className="border border-destructive/30">
          <p className="mb-3 text-sm text-destructive">{loadError}</p>
          <Button type="button" variant="outline" size="sm" onClick={() => void loadMember()}>
            Retry
          </Button>
        </GlassCard>
      )}

      {!isLoading && !loadError && !member && (
        <GlassCard>
          <p className="text-muted-foreground">Member not found.</p>
        </GlassCard>
      )}

      {!isLoading && !loadError && member && (
        <GlassCard>
          <MemberForm
            mode="edit"
            initialValues={member}
            onSubmit={handleSubmit}
            onCancel={() => navigate(`/members/${member.id}`)}
            submitError={submitError}
          />
        </GlassCard>
      )}
    </PageWrapper>
  );
}
