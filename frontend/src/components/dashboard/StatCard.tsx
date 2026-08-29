import type { LucideIcon } from 'lucide-react';
import { Card } from '../ui/Card';
import { cn } from '../../lib/cn';

export type StatCardTone = 'default' | 'success' | 'warning' | 'destructive';

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: StatCardTone;
  hint?: string;
}

const toneClasses: Record<StatCardTone, string> = {
  default: 'bg-primary/10 text-primary',
  success: 'bg-emerald-500/10 text-emerald-600',
  warning: 'bg-amber-500/10 text-amber-600',
  destructive: 'bg-destructive/10 text-destructive',
};

/** A single metric tile for the dashboard's stat grid. */
export function StatCard({ label, value, icon: Icon, tone = 'default', hint }: StatCardProps) {
  return (
    <Card variant="glass" className="flex items-start justify-between gap-4">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <span className="text-2xl font-bold tracking-tight text-foreground">{value}</span>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', toneClasses[tone])}>
        <Icon className="h-5 w-5" />
      </div>
    </Card>
  );
}
