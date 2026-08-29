import { useEffect, useState, type FormEvent } from 'react';
import { Button } from '../ui/Button';
import { Dialog } from '../ui/Dialog';
import { GradientButton } from '../ui/GradientButton';
import { Input } from '../ui/Input';
import type { PaymentMethod, RecordPaymentPayload } from '../../types/fee';

interface RecordPaymentFormProps {
  open: boolean;
  submitting: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (payload: RecordPaymentPayload) => void;
}

interface FormState {
  member_id: string;
  subscription_id: string;
  amount: string;
  payment_method: PaymentMethod;
  payment_date: string;
  notes: string;
}

const emptyState: FormState = {
  member_id: '',
  subscription_id: '',
  amount: '',
  payment_method: 'cash',
  payment_date: '',
  notes: '',
};

/** Dialog form to record a new payment against a member's subscription. */
export function RecordPaymentForm({ open, submitting, error, onClose, onSubmit }: RecordPaymentFormProps) {
  const [form, setForm] = useState<FormState>(emptyState);

  useEffect(() => {
    if (open) setForm(emptyState);
  }, [open]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload: RecordPaymentPayload = {
      member_id: Number(form.member_id),
      subscription_id: Number(form.subscription_id),
      amount: Number(form.amount),
      payment_method: form.payment_method,
      payment_date: form.payment_date || undefined,
      notes: form.notes.trim() ? form.notes.trim() : null,
    };
    onSubmit(payload);
  };

  return (
    <Dialog open={open} onClose={onClose} title="Record Payment">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Member ID"
            id="payment-member-id"
            type="number"
            min="1"
            required
            value={form.member_id}
            onChange={(e) => setForm((prev) => ({ ...prev, member_id: e.target.value }))}
          />
          <Input
            label="Subscription ID"
            id="payment-subscription-id"
            type="number"
            min="1"
            required
            value={form.subscription_id}
            onChange={(e) => setForm((prev) => ({ ...prev, subscription_id: e.target.value }))}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Amount"
            id="payment-amount"
            type="number"
            min="0"
            step="0.01"
            required
            value={form.amount}
            onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
          />
          <div>
            <label htmlFor="payment-method" className="mb-1.5 block text-sm font-medium text-foreground">
              Method
            </label>
            <select
              id="payment-method"
              className="flex h-10 w-full rounded-xl border-2 border-input bg-background px-4 py-2 text-sm outline-none transition-colors focus:border-primary"
              value={form.payment_method}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, payment_method: e.target.value as PaymentMethod }))
              }
            >
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
        <Input
          label="Payment Date (optional)"
          id="payment-date"
          type="date"
          value={form.payment_date}
          onChange={(e) => setForm((prev) => ({ ...prev, payment_date: e.target.value }))}
        />
        <Input
          label="Notes (optional)"
          id="payment-notes"
          value={form.notes}
          onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
        />

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <GradientButton type="submit" disabled={submitting}>
            {submitting ? 'Recording…' : 'Record Payment'}
          </GradientButton>
        </div>
      </form>
    </Dialog>
  );
}
