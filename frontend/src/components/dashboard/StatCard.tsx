import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../ui/Card';
import { cn } from '../../lib/cn';

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  hint?: string;
  /** When set, the whole card becomes a link to the detailed records/stats behind this metric. */
  to?: string;
}

/** A single metric tile for the dashboard's stat grid — clickable through to the underlying records when `to` is set. */
export function StatCard({ label, value, icon: Icon, hint, to }: StatCardProps) {
  const card = (
    <Card
      variant="glass"
      className={cn(
        'flex items-start justify-between gap-4 border-amber-200 bg-gradient-to-br from-amber-100 to-orange-200',
        to && 'transition-shadow hover:shadow-lg hover:shadow-primary/10',
      )}
    >
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <span className="text-2xl font-bold tracking-tight text-foreground">{value}</span>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-500 text-white shadow-[0_0_14px_rgba(34,197,94,0.55)]"
      >
        <Icon className="h-5 w-5" />
      </div>
    </Card>
  );

  if (!to) return card;

  return (
    <Link to={to} className="block rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
      {card}
    </Link>
  );
}
