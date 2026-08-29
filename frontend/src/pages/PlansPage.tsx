import { Loader2, Plus } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import { PlanForm } from '../components/fees/PlanForm';
import { PlanTable } from '../components/fees/PlanTable';
import { GlassCard } from '../components/ui/GlassCard';
import { GradientButton } from '../components/ui/GradientButton';
import { PageWrapper } from '../components/ui/PageWrapper';
import { TextReveal } from '../components/ui/TextReveal';
import { feeService } from '../services/feeService';
import type { MembershipPlan, PlanCreatePayload } from '../types/fee';

function extractErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    const detail = (error.response?.data as { detail?: string } | undefined)?.detail;
    if (typeof detail === 'string') return detail;
  }
  return fallback;
}

export default function PlansPage() {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadPlans = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await feeService.listPlans();
      setPlans(data);
    } catch (error) {
      setLoadError(extractErrorMessage(error, 'Failed to load membership plans.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPlans();
  }, [loadPlans]);

  const handleCreateClick = () => {
    setEditingPlan(null);
    setFormError(null);
    setFormOpen(true);
  };

  const handleEditClick = (plan: MembershipPlan) => {
    setEditingPlan(plan);
    setFormError(null);
    setFormOpen(true);
  };

  const handleDeleteClick = async (plan: MembershipPlan) => {
    const confirmed = window.confirm(`Delete plan "${plan.name}"? This cannot be undone.`);
    if (!confirmed) return;
    try {
      await feeService.deletePlan(plan.id);
      setPlans((prev) => prev.filter((item) => item.id !== plan.id));
    } catch (error) {
      window.alert(extractErrorMessage(error, 'Failed to delete plan.'));
    }
  };

  const handleFormSubmit = async (payload: PlanCreatePayload) => {
    setSubmitting(true);
    setFormError(null);
    try {
      if (editingPlan) {
        const updated = await feeService.updatePlan(editingPlan.id, payload);
        setPlans((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      } else {
        const created = await feeService.createPlan(payload);
        setPlans((prev) => [...prev, created]);
      }
      setFormOpen(false);
      setEditingPlan(null);
    } catch (error) {
      setFormError(extractErrorMessage(error, 'Failed to save plan.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageWrapper>
      <div className="mb-6 flex items-center justify-between">
        <TextReveal as="h1" className="text-2xl">
          Membership Plans
        </TextReveal>
        <GradientButton onClick={handleCreateClick}>
          <Plus className="h-4 w-4" />
          New Plan
        </GradientButton>
      </div>

      <GlassCard>
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading plans…
          </div>
        ) : loadError ? (
          <div className="py-10 text-center text-destructive">{loadError}</div>
        ) : plans.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground">
            No membership plans yet. Create your first plan to get started.
          </div>
        ) : (
          <PlanTable plans={plans} onEdit={handleEditClick} onDelete={handleDeleteClick} />
        )}
      </GlassCard>

      <PlanForm
        open={formOpen}
        plan={editingPlan}
        submitting={submitting}
        error={formError}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
      />
    </PageWrapper>
  );
}
