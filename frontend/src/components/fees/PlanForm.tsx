import { useEffect, useState, type FormEvent } from 'react';
import { Button } from '../ui/Button';
import { Dialog } from '../ui/Dialog';
import { GradientButton } from '../ui/GradientButton';
import { Input } from '../ui/Input';
import type { DurationType, MembershipPlan, PlanCreatePayload } from '../../types/fee';

interface PlanFormProps {
  open: boolean;
  plan: MembershipPlan | null;
  submitting: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (payload: PlanCreatePayload & { is_active?: boolean }) => void;
}

interface FormState {
  name: string;
  description: string;
  price: string;
  duration_type: DurationType;
  is_active: boolean;
}

const emptyState: FormState = {
  name: '',
  description: '',
  price: '',
  duration_type: 'monthly',
  is_active: true,
};

function toFormState(plan: MembershipPlan | null): FormState {
  if (!plan) return emptyState;
  return {
    name: plan.name,
    description: plan.description ?? '',
    price: String(plan.price),
    duration_type: plan.duration_type,
    is_active: plan.is_active,
  };
}

/** Create/edit dialog for a membership plan. */
export function PlanForm({ open, plan, submitting, error, onClose, onSubmit }: PlanFormProps) {
  const [form, setForm] = useState<FormState>(() => toFormState(plan));

  useEffect(() => {
    if (open) setForm(toFormState(plan));
  }, [open, plan]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // `is_active` only applies to editing an existing plan — the checkbox
    // otherwise updated local state with nothing ever reading it back out,
    // so toggling it on an existing plan silently did nothing.
    const payload: PlanCreatePayload & { is_active?: boolean } = {
      name: form.name.trim(),
      description: form.description.trim() ? form.description.trim() : null,
      price: Number(form.price),
      duration_type: form.duration_type,
      ...(plan ? { is_active: form.is_active } : {}),
    };
    onSubmit(payload);
  };

  return (
    <Dialog open={open} onClose={onClose} title={plan ? 'Edit Plan' : 'New Plan'}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Name"
          id="plan-name"
          required
          value={form.name}
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
        />
        <Input
          label="Description"
          id="plan-description"
          value={form.description}
          onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Price"
            id="plan-price"
            type="number"
            min="0"
            step="0.01"
            required
            value={form.price}
            onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
          />
          <div>
            <label htmlFor="plan-duration-type" className="mb-1.5 block text-sm font-medium text-foreground">
              Billing Cycle
            </label>
            <select
              id="plan-duration-type"
              className="flex h-10 w-full rounded-xl border-2 border-input bg-background px-4 py-2 text-sm outline-none transition-colors focus:border-primary"
              value={form.duration_type}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, duration_type: e.target.value as DurationType }))
              }
            >
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="half_yearly">Half Yearly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm font-medium text-foreground">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
            className="h-4 w-4 rounded border-input"
          />
          Active
        </label>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <GradientButton type="submit" disabled={submitting}>
            {submitting ? 'Saving…' : plan ? 'Save Changes' : 'Create Plan'}
          </GradientButton>
        </div>
      </form>
    </Dialog>
  );
}
