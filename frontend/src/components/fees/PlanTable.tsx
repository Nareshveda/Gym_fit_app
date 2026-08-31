import { Pencil, Trash2 } from 'lucide-react';
import { formatINR } from '../../lib/currency';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/Table';
import type { MembershipPlan } from '../../types/fee';

interface PlanTableProps {
  plans: MembershipPlan[];
  onEdit: (plan: MembershipPlan) => void;
  onDelete: (plan: MembershipPlan) => void;
}

const durationLabel: Record<MembershipPlan['duration_type'], string> = {
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  half_yearly: 'Half Yearly',
  yearly: 'Yearly',
};

export function PlanTable({ plans, onEdit, onDelete }: PlanTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Price</TableHead>
          <TableHead>Billing Cycle</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {plans.map((plan) => (
          <TableRow key={plan.id}>
            <TableCell>
              <div className="font-medium text-foreground">{plan.name}</div>
              {plan.description && (
                <div className="text-xs text-muted-foreground">{plan.description}</div>
              )}
            </TableCell>
            <TableCell>{formatINR(plan.price)}</TableCell>
            <TableCell>{durationLabel[plan.duration_type]}</TableCell>
            <TableCell>
              <Badge variant={plan.is_active ? 'success' : 'outline'}>
                {plan.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Edit ${plan.name}`}
                  onClick={() => onEdit(plan)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Delete ${plan.name}`}
                  onClick={() => onDelete(plan)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
