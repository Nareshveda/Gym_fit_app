import {
  AlertTriangle,
  Building2,
  CalendarCheck,
  Clock,
  DollarSign,
  Flame,
  Loader2,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MiniBarList } from '../components/dashboard/MiniBarList';
import { StatCard } from '../components/dashboard/StatCard';
import { TrendBarChart } from '../components/dashboard/TrendBarChart';
import { Badge } from '../components/ui/Badge';
import { GlassCard } from '../components/ui/GlassCard';
import { PageWrapper } from '../components/ui/PageWrapper';
import { TextReveal } from '../components/ui/TextReveal';
import { cn } from '../lib/cn';
import { formatINR } from '../lib/currency';
import { extractErrorMessage } from '../lib/extractErrorMessage';
import { dashboardService } from '../services/dashboardService';
import type { DashboardStats } from '../types/dashboard';

function formatDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

/** "2026-08" -> "Aug" */
function monthShortLabel(value: string): string {
  const [year, month] = value.split('-').map(Number);
  const parsed = new Date(year, (month ?? 1) - 1, 1);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, { month: 'short' });
}

function revenueTrendHint(thisMonth: string, lastMonth: string): string {
  const current = Number(thisMonth);
  const previous = Number(lastMonth);
  if (previous === 0) return current > 0 ? 'New revenue this month' : 'No revenue recorded last month';
  const pctChange = ((current - previous) / previous) * 100;
  const direction = pctChange >= 0 ? 'up' : 'down';
  return `${direction} ${Math.abs(pctChange).toFixed(0)}% vs last month (${formatINR(lastMonth)})`;
}

// Orangish-yellow surface (vs. the app's usual white glass cards) so the
// Dashboard's data cards read as a distinct, livelier zone; icons go on a
// radiant green badge for contrast against that warm background.
const DASHBOARD_CARD_CLASSES = 'border-amber-200 bg-gradient-to-br from-amber-100 to-orange-200';
const DASHBOARD_ICON_CLASSES = 'text-green-600 drop-shadow-[0_0_6px_rgba(34,197,94,0.5)]';

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
            <StatCard
              label="Total Members"
              value={stats.total_members.toLocaleString()}
              icon={Users}
              to="/members"
            />
            <StatCard
              label="Active Members"
              value={stats.active_members.toLocaleString()}
              icon={UserCheck}
              to="/members?status=active"
            />
            <StatCard
              label="Expiring Soon"
              value={stats.expiring_soon_count.toLocaleString()}
              icon={Clock}
              to="/payments/overdue"
            />
            <StatCard
              label="Overdue"
              value={stats.overdue_count.toLocaleString()}
              icon={AlertTriangle}
              to="/payments/overdue"
            />
            <StatCard
              label="Revenue This Month"
              value={formatINR(stats.revenue_this_month)}
              icon={DollarSign}
              hint={revenueTrendHint(stats.revenue_this_month, stats.revenue_last_month)}
              to="/payments"
            />
            <StatCard
              label="Attendance Today"
              value={stats.attendance_today.toLocaleString()}
              icon={CalendarCheck}
              hint={`${stats.attendance_this_week.toLocaleString()} check-ins this week`}
              to="/attendance"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {stats.most_active_member ? (
              <Link to={`/members/${stats.most_active_member.member_id}`} className="block">
                <GlassCard className={cn('h-full transition-shadow hover:shadow-lg hover:shadow-primary/10', DASHBOARD_CARD_CLASSES)}>
                  <div className="mb-4 flex items-center gap-2">
                    <Flame className={cn('h-5 w-5', DASHBOARD_ICON_CLASSES)} />
                    <h2 className="text-lg font-semibold text-foreground">Most Active Member</h2>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-base font-semibold text-foreground">
                        {stats.most_active_member.member_name}
                      </p>
                      <p className="text-sm text-muted-foreground">Last 30 days</p>
                    </div>
                    <Badge variant="success">{stats.most_active_member.visit_count} visits</Badge>
                  </div>
                </GlassCard>
              </Link>
            ) : (
              <GlassCard className={DASHBOARD_CARD_CLASSES}>
                <div className="mb-4 flex items-center gap-2">
                  <Flame className={cn('h-5 w-5', DASHBOARD_ICON_CLASSES)} />
                  <h2 className="text-lg font-semibold text-foreground">Most Active Member</h2>
                </div>
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No check-ins recorded in the last 30 days.
                </p>
              </GlassCard>
            )}

            <GlassCard className={DASHBOARD_CARD_CLASSES}>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingDown className={cn('h-5 w-5', DASHBOARD_ICON_CLASSES)} />
                  <h2 className="text-lg font-semibold text-foreground">Needs a Nudge</h2>
                </div>
                {stats.at_risk_count > 0 && <Badge variant="warning">{stats.at_risk_count} at risk</Badge>}
              </div>
              {stats.at_risk_members.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  Everyone active has checked in within the last 14 days. Nice work.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {stats.at_risk_members.map((member) => (
                    <li key={member.member_id} className="flex items-center justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
                      <Link
                        to={`/members/${member.member_id}`}
                        className="font-medium text-foreground hover:text-primary"
                      >
                        {member.member_name}
                      </Link>
                      <span className="text-xs text-muted-foreground">
                        {member.last_visit_date ? `Last seen ${formatDate(member.last_visit_date)}` : 'Never checked in'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </GlassCard>
          </div>

          <GlassCard className={DASHBOARD_CARD_CLASSES}>
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp className={cn('h-5 w-5', DASHBOARD_ICON_CLASSES)} />
              <h2 className="text-lg font-semibold text-foreground">New Members — Last 6 Months</h2>
            </div>
            <TrendBarChart
              items={stats.new_members_by_month.map((item) => ({
                label: monthShortLabel(item.month),
                value: item.count,
              }))}
            />
          </GlassCard>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <GlassCard className={DASHBOARD_CARD_CLASSES}>
              <div className="mb-4 flex items-center gap-2">
                <Building2 className={cn('h-5 w-5', DASHBOARD_ICON_CLASSES)} />
                <h2 className="text-lg font-semibold text-foreground">Members per Branch</h2>
              </div>
              <MiniBarList
                items={stats.members_by_location.map((item) => ({
                  label: item.location_name,
                  value: item.member_count,
                  to: item.location_id ? `/members?location_id=${item.location_id}` : '/members',
                }))}
                emptyMessage="No active members yet."
              />
            </GlassCard>

            <GlassCard className={DASHBOARD_CARD_CLASSES}>
              <div className="mb-4 flex items-center gap-2">
                <Users className={cn('h-5 w-5', DASHBOARD_ICON_CLASSES)} />
                <h2 className="text-lg font-semibold text-foreground">Plan Split</h2>
              </div>
              <MiniBarList
                items={stats.plan_split.map((item) => ({
                  label: item.plan_name,
                  value: item.member_count,
                }))}
                emptyMessage="No active members yet."
              />
            </GlassCard>
          </div>

          <GlassCard className={DASHBOARD_CARD_CLASSES}>
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
                    <Link
                      to={`/members/${item.member_id}`}
                      className="font-medium text-foreground hover:text-primary"
                    >
                      {item.member_name}
                    </Link>
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
