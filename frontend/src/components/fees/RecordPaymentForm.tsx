import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Button } from '../ui/Button';
import { Dialog } from '../ui/Dialog';
import { GradientButton } from '../ui/GradientButton';
import { Input } from '../ui/Input';
import { feeService } from '../../services/feeService';
import { memberService } from '../../services/memberService';
import type { MemberSubscription, PaymentMethod, RecordPaymentPayload } from '../../types/fee';
import type { Member } from '../../types/member';

interface RecordPaymentFormProps {
  open: boolean;
  submitting: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (payload: RecordPaymentPayload) => void;
}

interface FormState {
  amount: string;
  payment_method: PaymentMethod;
  reference_number: string;
  payment_date: string;
  notes: string;
}

const emptyState: FormState = {
  amount: '',
  payment_method: 'cash',
  reference_number: '',
  payment_date: '',
  notes: '',
};

const SEARCH_DEBOUNCE_MS = 300;

function subscriptionLabel(subscription: MemberSubscription): string {
  const planName = subscription.plan?.name ?? `Plan #${subscription.plan_id}`;
  return `${planName} — ${subscription.status} (due ${subscription.due_date})`;
}

/**
 * Dialog form to record a new payment against a member's subscription.
 *
 * Staff search for the member by name/phone/member code instead of typing a
 * raw numeric ID — once picked, their subscriptions load into a second
 * dropdown (also no raw ID typing), auto-selecting the only one if there's
 * just one.
 */
export function RecordPaymentForm({ open, submitting, error, onClose, onSubmit }: RecordPaymentFormProps) {
  const [form, setForm] = useState<FormState>(emptyState);

  const [memberQuery, setMemberQuery] = useState('');
  const [memberResults, setMemberResults] = useState<Member[]>([]);
  const [isSearchingMembers, setIsSearchingMembers] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const debounceRef = useRef<number | undefined>(undefined);

  const [subscriptions, setSubscriptions] = useState<MemberSubscription[]>([]);
  const [subscriptionId, setSubscriptionId] = useState('');
  const [isLoadingSubscriptions, setIsLoadingSubscriptions] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(emptyState);
    setMemberQuery('');
    setMemberResults([]);
    setSelectedMember(null);
    setSubscriptions([]);
    setSubscriptionId('');
  }, [open]);

  useEffect(() => {
    if (debounceRef.current !== undefined) window.clearTimeout(debounceRef.current);
    const trimmed = memberQuery.trim();
    if (!trimmed || selectedMember) {
      setMemberResults([]);
      return;
    }
    setIsSearchingMembers(true);
    debounceRef.current = window.setTimeout(() => {
      memberService
        .list({ search: trimmed })
        .then((results) => setMemberResults(results))
        .catch(() => setMemberResults([]))
        .finally(() => setIsSearchingMembers(false));
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current !== undefined) window.clearTimeout(debounceRef.current);
    };
  }, [memberQuery, selectedMember]);

  useEffect(() => {
    if (!selectedMember) return;
    setIsLoadingSubscriptions(true);
    feeService
      .listMemberSubscriptions(Number(selectedMember.id))
      .then((results) => {
        setSubscriptions(results);
        setSubscriptionId(results.length === 1 ? String(results[0].id) : '');
      })
      .catch(() => setSubscriptions([]))
      .finally(() => setIsLoadingSubscriptions(false));
  }, [selectedMember]);

  const handlePickMember = (member: Member) => {
    setSelectedMember(member);
    setMemberQuery('');
    setMemberResults([]);
  };

  const handleClearMember = () => {
    setSelectedMember(null);
    setSubscriptions([]);
    setSubscriptionId('');
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedMember || !subscriptionId) return;
    const payload: RecordPaymentPayload = {
      member_id: Number(selectedMember.id),
      subscription_id: Number(subscriptionId),
      amount: Number(form.amount),
      payment_method: form.payment_method,
      payment_date: form.payment_date || undefined,
      reference_number: form.reference_number.trim() ? form.reference_number.trim() : null,
      notes: form.notes.trim() ? form.notes.trim() : null,
    };
    onSubmit(payload);
  };

  const referenceRequired = form.payment_method === 'upi' || form.payment_method === 'bank_transfer';
  const canSubmit = Boolean(selectedMember && subscriptionId && form.amount);

  return (
    <Dialog open={open} onClose={onClose} title="Record Payment">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Member</label>
          {selectedMember ? (
            <div className="flex items-center justify-between rounded-xl border-2 border-input bg-background px-4 py-2 text-sm">
              <span>
                <span className="font-mono text-muted-foreground">{selectedMember.member_code}</span>{' '}
                {selectedMember.full_name}
              </span>
              <Button type="button" variant="ghost" size="sm" onClick={handleClearMember}>
                Change
              </Button>
            </div>
          ) : (
            <>
              <Input
                id="payment-member-search"
                placeholder="Search by name, phone, or member code…"
                value={memberQuery}
                onChange={(e) => setMemberQuery(e.target.value)}
              />
              {memberQuery.trim() && (
                <div className="mt-2 max-h-40 divide-y divide-border overflow-y-auto rounded-xl border border-border">
                  {isSearchingMembers && <p className="p-3 text-sm text-muted-foreground">Searching…</p>}
                  {!isSearchingMembers && memberResults.length === 0 && (
                    <p className="p-3 text-sm text-muted-foreground">No members found.</p>
                  )}
                  {!isSearchingMembers &&
                    memberResults.map((member) => (
                      <button
                        key={member.id}
                        type="button"
                        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-accent"
                        onClick={() => handlePickMember(member)}
                      >
                        <span className="font-mono text-muted-foreground">{member.member_code}</span>
                        <span className="flex-1 px-2">{member.full_name}</span>
                        <span className="text-muted-foreground">{member.phone}</span>
                      </button>
                    ))}
                </div>
              )}
            </>
          )}
        </div>

        <div>
          <label htmlFor="payment-subscription" className="mb-1.5 block text-sm font-medium text-foreground">
            Subscription
          </label>
          <select
            id="payment-subscription"
            className="flex h-10 w-full rounded-xl border-2 border-input bg-background px-4 py-2 text-sm outline-none transition-colors focus:border-primary disabled:cursor-not-allowed disabled:opacity-50"
            value={subscriptionId}
            onChange={(e) => setSubscriptionId(e.target.value)}
            disabled={!selectedMember || isLoadingSubscriptions}
            required
          >
            <option value="" disabled>
              {!selectedMember
                ? 'Pick a member first'
                : isLoadingSubscriptions
                  ? 'Loading subscriptions…'
                  : subscriptions.length === 0
                    ? 'No subscriptions for this member'
                    : 'Select a subscription'}
            </option>
            {subscriptions.map((subscription) => (
              <option key={subscription.id} value={subscription.id}>
                {subscriptionLabel(subscription)}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Amount"
            id="payment-amount"
            type="number"
            min="0"
            step="0.01"
            required
            leadingElement={<span className="font-semibold text-primary">₹</span>}
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
              <option value="upi">UPI</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
        <Input
          label={referenceRequired ? 'Transaction / Reference No.' : 'Transaction / Reference No. (optional)'}
          id="payment-reference-number"
          value={form.reference_number}
          onChange={(e) => setForm((prev) => ({ ...prev, reference_number: e.target.value }))}
          required={referenceRequired}
        />
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
          <GradientButton type="submit" disabled={submitting || !canSubmit}>
            {submitting ? 'Recording…' : 'Record Payment'}
          </GradientButton>
        </div>
      </form>
    </Dialog>
  );
}
