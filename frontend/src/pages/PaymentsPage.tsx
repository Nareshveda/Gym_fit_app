import { Loader2, Plus } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import { Link } from 'react-router-dom';
import { PaymentTable } from '../components/fees/PaymentTable';
import { RecordPaymentForm } from '../components/fees/RecordPaymentForm';
import { GlassCard } from '../components/ui/GlassCard';
import { GradientButton } from '../components/ui/GradientButton';
import { PageWrapper } from '../components/ui/PageWrapper';
import { TextReveal } from '../components/ui/TextReveal';
import { feeService } from '../services/feeService';
import type { Payment, RecordPaymentPayload } from '../types/fee';

function extractErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    const detail = (error.response?.data as { detail?: string } | undefined)?.detail;
    if (typeof detail === 'string') return detail;
  }
  return fallback;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadPayments = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await feeService.listPayments();
      setPayments(data);
    } catch (error) {
      setLoadError(extractErrorMessage(error, 'Failed to load payments.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPayments();
  }, [loadPayments]);

  const handleFormSubmit = async (payload: RecordPaymentPayload) => {
    setSubmitting(true);
    setFormError(null);
    try {
      const created = await feeService.recordPayment(payload);
      setPayments((prev) => [created, ...prev]);
      setFormOpen(false);
    } catch (error) {
      setFormError(extractErrorMessage(error, 'Failed to record payment.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageWrapper>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <TextReveal as="h1" className="text-2xl">
          Payments
        </TextReveal>
        <div className="flex gap-2">
          <Link
            to="/payments/overdue"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-input bg-transparent px-4 text-sm font-semibold transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            View Overdue
          </Link>
          <GradientButton onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" />
            Record Payment
          </GradientButton>
        </div>
      </div>

      <GlassCard>
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading payments…
          </div>
        ) : loadError ? (
          <div className="py-10 text-center text-destructive">{loadError}</div>
        ) : payments.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground">
            No payments recorded yet.
          </div>
        ) : (
          <PaymentTable payments={payments} />
        )}
      </GlassCard>

      <RecordPaymentForm
        open={formOpen}
        submitting={submitting}
        error={formError}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
      />
    </PageWrapper>
  );
}
