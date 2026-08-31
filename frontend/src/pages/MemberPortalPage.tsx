import { useCallback, useEffect, useState } from 'react';
import { GlassCard } from '../components/ui/GlassCard';
import { LineChart } from '../components/ui/LineChart';
import { PageWrapper } from '../components/ui/PageWrapper';
import { TextReveal } from '../components/ui/TextReveal';
import { useAuth } from '../context/AuthContext';
import { extractErrorMessage } from '../lib/extractErrorMessage';
import { memberSelfService } from '../services/memberSelfService';
import type { AttendanceRecord } from '../types/attendance';
import type { VitalsDashboard } from '../types/vital';

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

function formatDateTime(value: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

/** Read-only self-service view: a member's own attendance history and vitals/progress — nothing else. */
export default function MemberPortalPage() {
  const { user } = useAuth();

  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [vitals, setVitals] = useState<VitalsDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [attendanceData, vitalsData] = await Promise.all([
        memberSelfService.getMyAttendance(),
        memberSelfService.getMyVitalsDashboard(),
      ]);
      setAttendance(attendanceData);
      setVitals(vitalsData);
    } catch (err) {
      setLoadError(extractErrorMessage(err, 'Could not load your data.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const weightSeries =
    vitals?.history.map((v) => ({ label: formatDate(v.recorded_at), value: Number(v.weight_kg) })) ?? [];

  return (
    <PageWrapper>
      <TextReveal as="h1" className="mb-6 text-2xl">
        Welcome{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}
      </TextReveal>

      {isLoading && (
        <GlassCard>
          <p className="text-muted-foreground">Loading your data...</p>
        </GlassCard>
      )}

      {!isLoading && loadError && (
        <GlassCard className="border border-destructive/30">
          <p className="text-sm text-destructive">{loadError}</p>
        </GlassCard>
      )}

      {!isLoading && !loadError && (
        <div className="flex flex-col gap-6">
          {vitals && (
            <>
              <div className="grid gap-4 sm:grid-cols-4">
                <GlassCard>
                  <p className="text-xs uppercase text-muted-foreground">Current Weight</p>
                  <p className="text-2xl font-bold">
                    {vitals.latest ? `${vitals.latest.weight_kg} kg` : '—'}
                  </p>
                </GlassCard>
                <GlassCard>
                  <p className="text-xs uppercase text-muted-foreground">Current BMI</p>
                  <p className="text-2xl font-bold">{vitals.latest?.bmi ?? '—'}</p>
                </GlassCard>
                <GlassCard>
                  <p className="text-xs uppercase text-muted-foreground">Weight Change</p>
                  <p
                    className={
                      vitals.weight_change_kg && Number(vitals.weight_change_kg) < 0
                        ? 'text-2xl font-bold text-emerald-600'
                        : 'text-2xl font-bold'
                    }
                  >
                    {vitals.weight_change_kg ? `${vitals.weight_change_kg} kg` : '—'}
                  </p>
                  <p className="text-xs text-muted-foreground">vs. your baseline</p>
                </GlassCard>
                <GlassCard>
                  <p className="text-xs uppercase text-muted-foreground">BMI Change</p>
                  <p className="text-2xl font-bold">{vitals.bmi_change ?? '—'}</p>
                  <p className="text-xs text-muted-foreground">vs. your baseline</p>
                </GlassCard>
              </div>

              <GlassCard>
                <h3 className="mb-4 text-lg font-semibold">Weight Trend</h3>
                <LineChart points={weightSeries} unit="kg" />
              </GlassCard>
            </>
          )}

          <GlassCard>
            <h3 className="mb-4 text-lg font-semibold">Your Attendance</h3>
            {attendance.length === 0 ? (
              <p className="text-sm text-muted-foreground">No check-ins recorded yet.</p>
            ) : (
              <ul className="divide-y divide-border">
                {attendance.map((record) => (
                  <li key={record.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                    <span className="font-medium text-foreground">{formatDate(record.date)}</span>
                    <span className="text-sm text-muted-foreground">
                      {formatDateTime(record.check_in_time)} – {formatDateTime(record.check_out_time)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </GlassCard>
        </div>
      )}
    </PageWrapper>
  );
}
