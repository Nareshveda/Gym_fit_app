import { Flame } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge, type BadgeVariant } from '../ui/Badge';
import { Button } from '../ui/Button';
import { cn } from '../../lib/cn';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/Table';
import type { Member, MemberStatus } from '../../types/member';

interface MemberTableProps {
  members: Member[];
  onDelete: (member: Member) => void;
}

const statusVariant: Record<MemberStatus, BadgeVariant> = {
  active: 'success',
  inactive: 'outline',
  expired: 'destructive',
};

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

const linkButtonClasses = cn(
  'inline-flex h-8 items-center justify-center rounded-xl border border-input px-3 text-sm font-semibold transition-colors hover:bg-accent hover:text-accent-foreground',
);

/** Tabular member listing used by `MembersPage`. */
export function MemberTable({ members, onDelete }: MemberTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Code</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Plan</TableHead>
          <TableHead>Streak</TableHead>
          <TableHead>Join Date</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((member) => (
          <TableRow key={member.id}>
            <TableCell className="font-mono text-muted-foreground">{member.member_code}</TableCell>
            <TableCell className="font-medium">
              <Link to={`/members/${member.id}`} className="hover:text-primary">
                {member.full_name}
              </Link>
            </TableCell>
            <TableCell className="text-muted-foreground">{member.email}</TableCell>
            <TableCell className="text-muted-foreground">{member.phone}</TableCell>
            <TableCell>
              <Badge variant={statusVariant[member.status]}>{member.status}</Badge>
            </TableCell>
            <TableCell className="text-muted-foreground">{member.current_plan_name ?? '—'}</TableCell>
            <TableCell>
              {member.current_streak > 0 ? (
                <span className="inline-flex items-center gap-1 font-medium text-orange-600">
                  <Flame className="h-4 w-4" />
                  {member.current_streak} {member.current_streak === 1 ? 'day' : 'days'}
                </span>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatDate(member.join_date)}
            </TableCell>
            <TableCell>
              <div className="flex items-center justify-end gap-2">
                <Link to={`/members/${member.id}`} className={linkButtonClasses}>
                  View
                </Link>
                <Link to={`/members/${member.id}/edit`} className={linkButtonClasses}>
                  Edit
                </Link>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => onDelete(member)}
                >
                  Delete
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
