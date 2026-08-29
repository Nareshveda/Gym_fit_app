import { Badge, type BadgeVariant } from '../ui/Badge';
import { GlassCard } from '../ui/GlassCard';
import { cn } from '../../lib/cn';
import type { Member, MemberStatus } from '../../types/member';

interface MemberCardProps {
  member: Member;
  className?: string;
}

const statusVariant: Record<MemberStatus, BadgeVariant> = {
  active: 'success',
  inactive: 'outline',
  expired: 'destructive',
};

function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : '';
  return `${first}${last}`.toUpperCase() || '?';
}

/** Profile summary card for a single member — used atop `MemberDetailPage`. */
export function MemberCard({ member, className }: MemberCardProps) {
  return (
    <GlassCard className={cn('flex flex-col items-start gap-4 sm:flex-row sm:items-center', className)}>
      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-lg font-semibold text-primary">
        {member.photo_url ? (
          <img
            src={member.photo_url}
            alt={member.full_name}
            className="h-full w-full object-cover"
          />
        ) : (
          initials(member.full_name)
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold">{member.full_name}</h2>
          <Badge variant={statusVariant[member.status]}>{member.status}</Badge>
        </div>
        <p className="truncate text-sm text-muted-foreground">{member.email}</p>
        <p className="text-sm text-muted-foreground">{member.phone}</p>
      </div>
    </GlassCard>
  );
}
