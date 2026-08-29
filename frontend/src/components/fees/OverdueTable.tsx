import { Badge } from '../ui/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/Table';
import type { MemberSubscription } from '../../types/fee';

interface OverdueTableProps {
  subscriptions: MemberSubscription[];
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

export function OverdueTable({ subscriptions }: OverdueTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Member</TableHead>
          <TableHead>Plan</TableHead>
          <TableHead>Due Date</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {subscriptions.map((subscription) => (
          <TableRow key={subscription.id}>
            <TableCell className="font-medium text-foreground">#{subscription.member_id}</TableCell>
            <TableCell>{subscription.plan?.name ?? `Plan #${subscription.plan_id}`}</TableCell>
            <TableCell>{formatDate(subscription.due_date)}</TableCell>
            <TableCell>
              <Badge variant={subscription.status === 'overdue' ? 'destructive' : 'warning'}>
                {subscription.status === 'overdue' ? 'Overdue' : 'Expiring Soon'}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
