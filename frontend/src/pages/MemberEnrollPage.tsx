import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MemberForm, type MemberFormValues } from '../components/members/MemberForm';
import { GlassCard } from '../components/ui/GlassCard';
import { PageWrapper } from '../components/ui/PageWrapper';
import { TextReveal } from '../components/ui/TextReveal';
import { extractErrorMessage } from '../lib/extractErrorMessage';
import { feeService } from '../services/feeService';
import { memberService } from '../services/memberService';
import { vitalService } from '../services/vitalService';

const GENERIC_ERROR = 'Something went wrong. Please try again.';

export default function MemberEnrollPage() {
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (values: MemberFormValues) => {
    setSubmitError(null);
    const { initial_height_cm, initial_weight_kg, membership_plan_id, ...memberPayload } = values;
    try {
      const created = await memberService.create(memberPayload);

      // Best-effort follow-ups: the member is already enrolled at this
      // point, so a failure here shouldn't block navigation — just surface
      // it so staff know to add the vitals/plan manually from the detail page.
      const followUps: Promise<unknown>[] = [];
      const weightKg = initial_weight_kg ? Number(initial_weight_kg) : undefined;
      if (weightKg) {
        followUps.push(
          vitalService.record(Number(created.id), {
            weight_kg: weightKg,
            height_cm: initial_height_cm ? Number(initial_height_cm) : undefined,
          }),
        );
      }
      if (membership_plan_id) {
        followUps.push(feeService.createMemberSubscription(Number(created.id), { plan_id: Number(membership_plan_id) }));
      }
      if (followUps.length > 0) {
        const results = await Promise.allSettled(followUps);
        const failed = results.some((result) => result.status === 'rejected');
        if (failed) {
          navigate(`/members/${created.id}`, {
            state: { warning: 'Member enrolled, but the initial vitals/membership plan could not be saved — please add them from this page.' },
          });
          return;
        }
      }

      navigate(`/members/${created.id}`);
    } catch (err) {
      setSubmitError(extractErrorMessage(err, GENERIC_ERROR));
    }
  };

  return (
    <PageWrapper>
      <div className="mb-6 flex items-center justify-between gap-4">
        <TextReveal as="h1" className="text-2xl">
          Enroll Member
        </TextReveal>
        <Link to="/members" className="text-sm font-medium text-primary hover:underline">
          Back to Members
        </Link>
      </div>
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
