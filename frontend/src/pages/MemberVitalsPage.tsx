import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { GlassCard } from '../components/ui/GlassCard';
import { GradientButton } from '../components/ui/GradientButton';
import { Input } from '../components/ui/Input';
import { LineChart } from '../components/ui/LineChart';
import { PageWrapper } from '../components/ui/PageWrapper';
import { TextReveal } from '../components/ui/TextReveal';
import { extractErrorMessage } from '../lib/extractErrorMessage';
import { memberService } from '../services/memberService';
import { vitalService } from '../services/vitalService';
import type { Member } from '../types/member';
import type { VitalsDashboard } from '../types/vital';

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

export default function MemberVitalsPage() {
  const { id } = useParams<{ id: string }>();
  const memberId = Number(id);

  const [member, setMember] = useState<Member | null>(null);
  const [dashboard, setDashboard] = useState<VitalsDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setLoadError(null);
    try {
      const [memberData, dashboardData] = await Promise.all([
        memberService.get(id),
        vitalService.getDashboard(memberId),
      ]);
      setMember(memberData);
      setDashboard(dashboardData);
    } catch (err) {
      setLoadError(extractErrorMessage(err, 'Could not load vitals.'));
    } finally {
      setIsLoading(false);
    }
  }, [id, memberId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleLogVital = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    const weightKg = Number(weight);
    if (!weight || Number.isNaN(weightKg) || weightKg <= 0) {
      setFormError('Enter a valid weight.');
      return;
    }
    setIsSubmitting(true);
    try {
      await vitalService.record(memberId, {
        weight_kg: weightKg,
        height_cm: height ? Number(height) : undefined,
        notes: notes || undefined,
      });
      setHeight('');
      setWeight('');
      setNotes('');
      await load();
    } catch (err) {
      setFormError(extractErrorMessage(err, 'Could not save this reading.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const weightSeries =
    dashboard?.history.map((v) => ({ label: formatDate(v.recorded_at), value: Number(v.weight_kg) })) ?? [];

  return (
    <PageWrapper>
      <div className="mb-6 flex items-center justify-between gap-4">
        <TextReveal as="h1" className="text-2xl">
          Vitals &amp; Progress{member ? ` — ${member.full_name}` : ''}
        </TextReveal>
        {id && (
          <Link to={`/members/${id}`} className="text-sm font-medium text-primary hover:underline">
            Back to Member
          </Link>
        )}
      </div>

      {isLoading && (
        <GlassCard>
          <p className="text-muted-foreground">Loading vitals...</p>
        </GlassCard>
      )}

      {!isLoading && loadError && (
        <GlassCard className="border border-destructive/30">
          <p className="text-sm text-destructive">{loadError}</p>
        </GlassCard>
      )}

      {!isLoading && !loadError && dashboard && (
        <div className="flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-4">
            <GlassCard>
              <p className="text-xs uppercase text-muted-foreground">Current Weight</p>
              <p className="text-2xl font-bold">
                {dashboard.latest ? `${dashboard.latest.weight_kg} kg` : '—'}
              </p>
            </GlassCard>
            <GlassCard>
              <p className="text-xs uppercase text-muted-foreground">Current BMI</p>
              <p className="text-2xl font-bold">{dashboard.latest?.bmi ?? '—'}</p>
            </GlassCard>
            <GlassCard>
              <p className="text-xs uppercase text-muted-foreground">Weight Change</p>
              <p
                className={
                  dashboard.weight_change_kg && Number(dashboard.weight_change_kg) < 0
                    ? 'text-2xl font-bold text-emerald-600'
                    : 'text-2xl font-bold'
                }
              >
                {dashboard.weight_change_kg ? `${dashboard.weight_change_kg} kg` : '—'}
              </p>
              <p className="text-xs text-muted-foreground">vs. enrollment baseline</p>
            </GlassCard>
            <GlassCard>
              <p className="text-xs uppercase text-muted-foreground">BMI Change</p>
              <p className="text-2xl font-bold">{dashboard.bmi_change ?? '—'}</p>
              <p className="text-xs text-muted-foreground">vs. enrollment baseline</p>
            </GlassCard>
          </div>

          <GlassCard>
            <h3 className="mb-4 text-lg font-semibold">Weight Trend</h3>
            <LineChart points={weightSeries} unit="kg" />
          </GlassCard>

          <GlassCard>
            <h3 className="mb-4 text-lg font-semibold">Log a New Reading</h3>
            <form onSubmit={handleLogVital} className="flex flex-col gap-4">
              {formError && <p className="text-sm text-destructive">{formError}</p>}
              <div className="grid gap-4 sm:grid-cols-3">
                <Input
                  id="vital_height"
                  type="number"
                  step="0.1"
                  min="0"
                  label="Height (cm)"
                  placeholder={dashboard.latest?.height_cm ? `Last: ${dashboard.latest.height_cm}` : undefined}
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                />
                <Input
                  id="vital_weight"
                  type="number"
                  step="0.1"
                  min="0"
                  label="Weight (kg)"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  required
                />
                <Input
                  id="vital_notes"
                  label="Notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              <div className="flex justify-end">
                <GradientButton type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Log Reading'}
                </GradientButton>
              </div>
            </form>
          </GlassCard>

          <GlassCard>
            <h3 className="mb-4 text-lg font-semibold">History</h3>
            {dashboard.history.length === 0 ? (
              <p className="text-sm text-muted-foreground">No vitals recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs uppercase text-muted-foreground">
                      <th className="py-2 pr-4">Date</th>
                      <th className="py-2 pr-4">Height</th>
                      <th className="py-2 pr-4">Weight</th>
                      <th className="py-2 pr-4">BMI</th>
                      <th className="py-2">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...dashboard.history].reverse().map((v) => (
                      <tr key={v.id} className="border-b border-border/50">
                        <td className="py-2 pr-4">{formatDate(v.recorded_at)}</td>
                        <td className="py-2 pr-4">{v.height_cm ? `${v.height_cm} cm` : '—'}</td>
                        <td className="py-2 pr-4">{v.weight_kg} kg</td>
                        <td className="py-2 pr-4">{v.bmi ?? '—'}</td>
                        <td className="py-2 text-muted-foreground">{v.notes ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </GlassCard>
        </div>
      )}
    </PageWrapper>
  );
}
