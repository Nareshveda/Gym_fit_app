import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/Table';
import type { Payment } from '../../types/fee';

interface PaymentTableProps {
  payments: Payment[];
}

const methodLabel: Record<Payment['payment_method'], string> = {
  card: 'Card',
  cash: 'Cash',
  bank_transfer: 'Bank Transfer',
  other: 'Other',
};

function formatAmount(amount: number): string {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(amount);
  } catch {
    return amount.toFixed(2);
  }
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

export function PaymentTable({ payments }: PaymentTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Member</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Method</TableHead>
          <TableHead>Payment Date</TableHead>
          <TableHead>Notes</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {payments.map((payment) => (
          <TableRow key={payment.id}>
            <TableCell className="font-medium text-foreground">#{payment.member_id}</TableCell>
            <TableCell>{formatAmount(payment.amount)}</TableCell>
            <TableCell>{methodLabel[payment.payment_method]}</TableCell>
            <TableCell>{formatDate(payment.payment_date)}</TableCell>
            <TableCell className="text-muted-foreground">{payment.notes ?? '—'}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
