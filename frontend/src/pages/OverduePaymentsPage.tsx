import { isAxiosError } from 'axios';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { OverdueTable } from '../components/fees/OverdueTable';
import { GlassCard } from '../components/ui/GlassCard';
import { PageWrapper } from '../components/ui/PageWrapper';
import { TextReveal } from '../components/ui/TextReveal';
import { feeService } from '../services/feeService';
import type { MemberSubscription } from '../types/fee';

function extractErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    const body = error.response?.data as { error?: { message?: string }; detail?: string } | undefined;
    if (typeof body?.error?.message === 'string') return body.error.message;
    if (typeof body?.detail === 'string') return body.detail;
  }
  return fallback;
}

export default function OverduePaymentsPage() {
  const [subscriptions, setSubscriptions] = useState<MemberSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadOverduePayments = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await feeService.listOverdueSubscriptions();
      setSubscriptions(data);
    } catch (error) {
      setLoadError(extractErrorMessage(error, 'Failed to load overdue payments.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOverduePayments();
  }, [loadOverduePayments]);

  return (
    <PageWrapper>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link
            to="/payments"
            className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Payments
          </Link>
          <TextReveal as="h1" className="text-2xl">
            Overdue Payments
          </TextReveal>
        </div>
      </div>

      <GlassCard>
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading overdue payments…
          </div>
        ) : loadError ? (
          <div className="py-10 text-center text-destructive">{loadError}</div>
        ) : subscriptions.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground">
            No overdue payments. Everyone is paid up.
          </div>
        ) : (
          <OverdueTable subscriptions={subscriptions} />
        )}
      </GlassCard>
    </PageWrapper>
  );
}
