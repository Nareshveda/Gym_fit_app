import { isAxiosError } from 'axios';
import {
  AlertTriangle,
  CalendarCheck,
  Clock,
  DollarSign,
  Loader2,
  UserCheck,
  Users,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { StatCard } from '../components/dashboard/StatCard';
import { Badge } from '../components/ui/Badge';
import { GlassCard } from '../components/ui/GlassCard';
import { PageWrapper } from '../components/ui/PageWrapper';
import { TextReveal } from '../components/ui/TextReveal';
import { dashboardService } from '../services/dashboardService';
import type { DashboardStats } from '../types/dashboard';

function extractErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    const detail = (error.response?.data as { detail?: string } | undefined)?.detail;
    if (typeof detail === 'string') return detail;
  }
  return fallback;
}

const currencyFormatter = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: 'USD',
});

function formatDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await dashboardService.getStats();
      setStats(data);
    } catch (error) {
      setLoadError(extractErrorMessage(error, 'Failed to load dashboard stats.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  return (
    <PageWrapper>
      <TextReveal as="h1" className="mb-6 text-2xl">
        Dashboard
      </TextReveal>

      {loading ? (
        <GlassCard>
          <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading dashboard…
          </div>
        </GlassCard>
      ) : loadError ? (
        <GlassCard>
          <div className="py-10 text-center text-destructive">{loadError}</div>
        </GlassCard>
      ) : stats ? (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard label="Total Members" value={stats.total_members.toLocaleString()} icon={Users} />
            <StatCard
              label="Active Members"
              value={stats.active_members.toLocaleString()}
              icon={UserCheck}
              tone="success"
            />
            <StatCard
              label="Expiring Soon"
              value={stats.expiring_soon_count.toLocaleString()}
              icon={Clock}
              tone="warning"
            />
            <StatCard
              label="Overdue"
              value={stats.overdue_count.toLocaleString()}
              icon={AlertTriangle}
              tone="destructive"
            />
            <StatCard
              label="Revenue This Month"
              value={currencyFormatter.format(stats.revenue_this_month)}
              icon={DollarSign}
              tone="success"
            />
            <StatCard
              label="Attendance Today"
              value={stats.attendance_today.toLocaleString()}
              icon={CalendarCheck}
            />
          </div>

          <GlassCard>
            <h2 className="mb-4 text-lg font-semibold text-foreground">Expiring Soon</h2>
            {stats.expiring_soon.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No subscriptions are expiring soon.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {stats.expiring_soon.map((item) => (
                  <li
                    key={item.subscription_id}
                    className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                  >
                    <span className="font-medium text-foreground">{item.member_name}</span>
                    <Badge variant="warning">Due {formatDate(item.due_date)}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </GlassCard>
        </div>
      ) : null}
    </PageWrapper>
  );
}
