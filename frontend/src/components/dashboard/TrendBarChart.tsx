interface TrendBarChartItem {
  label: string;
  value: number;
}

interface TrendBarChartProps {
  items: TrendBarChartItem[];
}

/** A simple vertical bar chart (e.g. new members per month) — no charting library required. */
export function TrendBarChart({ items }: TrendBarChartProps) {
  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <div className="flex items-end justify-between gap-2 sm:gap-4" style={{ height: 140 }}>
      {items.map((item) => (
        <div key={item.label} className="flex flex-1 flex-col items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{item.value}</span>
          <div className="flex w-full flex-1 items-end">
            <div
              className="w-full rounded-t-lg bg-gradient-brand transition-all"
              style={{ height: `${Math.max((item.value / max) * 100, item.value > 0 ? 6 : 2)}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
