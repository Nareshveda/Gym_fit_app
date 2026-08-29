import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { MemberCard } from '../components/members/MemberCard';
import { AnimatedList } from '../components/ui/AnimatedList';
import { Button } from '../components/ui/Button';
import { Dialog } from '../components/ui/Dialog';
import { GlassCard } from '../components/ui/GlassCard';
import { PageWrapper } from '../components/ui/PageWrapper';
import { TextReveal } from '../components/ui/TextReveal';
import { memberService } from '../services/memberService';
import type { Member } from '../types/member';

function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = (error.response?.data as { detail?: string } | undefined)?.detail;
    return detail ?? error.message;
  }
  return 'Something went wrong. Please try again.';
}

function formatDate(value: string | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

const genderLabels: Record<Member['gender'], string> = {
  male: 'Male',
  female: 'Female',
  other: 'Other',
  prefer_not_to_say: 'Prefer not to say',
};

export default function MemberDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [member, setMember] = useState<Member | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadMember = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await memberService.get(id);
      setMember(data);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadMember();
  }, [loadMember]);

  const handleDelete = async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      await memberService.remove(id);
      navigate('/members');
    } catch (err) {
      setError(extractErrorMessage(err));
      setIsDeleteOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <PageWrapper>
      <div className="mb-6 flex items-center justify-between gap-4">
        <TextReveal as="h1" className="text-2xl">
          Member Details
        </TextReveal>
        <Link to="/members" className="text-sm font-medium text-primary hover:underline">
          Back to Members
        </Link>
      </div>

      {isLoading && (
        <GlassCard>
          <p className="text-muted-foreground">Loading member...</p>
        </GlassCard>
      )}

      {!isLoading && error && (
        <GlassCard className="border border-destructive/30">
          <p className="mb-3 text-sm text-destructive">{error}</p>
          <Button type="button" variant="outline" size="sm" onClick={() => void loadMember()}>
            Retry
          </Button>
        </GlassCard>
      )}

      {!isLoading && !error && !member && (
        <GlassCard>
          <p className="text-muted-foreground">Member not found.</p>
        </GlassCard>
      )}

      {!isLoading && !error && member && (
        <div className="flex flex-col gap-6">
          <MemberCard member={member} />

          <div className="flex justify-end gap-3">
            <Link
              to={`/members/${member.id}/edit`}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-input px-4 text-sm font-semibold transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Edit
            </Link>
            <Button type="button" variant="destructive" onClick={() => setIsDeleteOpen(true)}>
              Remove Member
            </Button>
          </div>

          <AnimatedList className="flex flex-col gap-6">
            {[
              <GlassCard key="personal">
                <h3 className="mb-4 text-lg font-semibold">Personal Information</h3>
                <dl className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs uppercase text-muted-foreground">Date of Birth</dt>
                    <dd>{formatDate(member.date_of_birth)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase text-muted-foreground">Gender</dt>
                    <dd>{genderLabels[member.gender]}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-xs uppercase text-muted-foreground">Address</dt>
                    <dd className="whitespace-pre-wrap">{member.address}</dd>
                  </div>
                </dl>
              </GlassCard>,
              <GlassCard key="emergency">
                <h3 className="mb-4 text-lg font-semibold">Emergency Contact</h3>
                <dl className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs uppercase text-muted-foreground">Name</dt>
                    <dd>{member.emergency_contact_name}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase text-muted-foreground">Phone</dt>
                    <dd>{member.emergency_contact_phone}</dd>
                  </div>
                </dl>
              </GlassCard>,
              <GlassCard key="membership">
                <h3 className="mb-4 text-lg font-semibold">Membership</h3>
                <dl className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs uppercase text-muted-foreground">Join Date</dt>
                    <dd>{formatDate(member.join_date)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase text-muted-foreground">Status</dt>
                    <dd className="capitalize">{member.status}</dd>
                  </div>
                </dl>
              </GlassCard>,
            ]}
          </AnimatedList>
        </div>
      )}

      <Dialog open={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Remove Member">
        <p className="mb-4 text-sm text-muted-foreground">
          Are you sure you want to deactivate{' '}
          <span className="font-semibold text-foreground">{member?.full_name}</span>? This can be
          reversed later by an admin.
        </p>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={() => setIsDeleteOpen(false)}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" disabled={isDeleting} onClick={() => void handleDelete()}>
            {isDeleting ? 'Removing...' : 'Remove'}
          </Button>
        </div>
      </Dialog>
    </PageWrapper>
  );
}
