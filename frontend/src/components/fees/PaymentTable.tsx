import { formatINR } from '../../lib/currency';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/Table';
import type { Payment } from '../../types/fee';

interface PaymentTableProps {
  payments: Payment[];
}

const methodLabel: Record<Payment['payment_method'], string> = {
  card: 'Card',
  cash: 'Cash',
  upi: 'UPI',
  bank_transfer: 'Bank Transfer',
  other: 'Other',
};

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

/** "Monthly Basic (monthly)" — the admin-created Plan this payment was made against. */
function planLabel(payment: Payment): string {
  const plan = payment.subscription?.plan;
  return plan ? `${plan.name} (${plan.duration_type})` : '—';
}

export function PaymentTable({ payments }: PaymentTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Member</TableHead>
          <TableHead>Plan</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Method</TableHead>
          <TableHead>Reference No.</TableHead>
          <TableHead>Payment Date</TableHead>
          <TableHead>Notes</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {payments.map((payment) => (
          <TableRow key={payment.id}>
            <TableCell className="font-medium text-foreground">#{payment.member_id}</TableCell>
            <TableCell className="text-muted-foreground">{planLabel(payment)}</TableCell>
            <TableCell>{formatINR(payment.amount)}</TableCell>
            <TableCell>{methodLabel[payment.payment_method]}</TableCell>
            <TableCell className="text-muted-foreground">{payment.reference_number ?? '—'}</TableCell>
            <TableCell>{formatDate(payment.payment_date)}</TableCell>
            <TableCell className="text-muted-foreground">{payment.notes ?? '—'}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
