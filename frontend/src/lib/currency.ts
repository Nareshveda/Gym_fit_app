const formatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
});

/** Formats a Decimal-as-string (or number) amount as an INR currency string, e.g. "₹29.99". */
export function formatINR(value: string | number): string {
  const amount = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(amount)) return formatter.format(0);
  return formatter.format(amount);
}
