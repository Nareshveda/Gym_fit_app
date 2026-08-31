import { Link } from 'react-router-dom';

interface MiniBarListItem {
  label: string;
  value: number;
  /** When set, the row becomes a link to its detailed records. */
  to?: string;
}

interface MiniBarListProps {
  items: MiniBarListItem[];
  emptyMessage?: string;
}

/** A simple horizontal bar list (e.g. members per branch) — no charting library required. */
export function MiniBarList({ items, emptyMessage = 'No data yet.' }: MiniBarListProps) {
  if (items.length === 0) {
    return <p className="py-4 text-center text-sm text-muted-foreground">{emptyMessage}</p>;
  }
  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => {
        const row = (
          <>
            <span className="w-28 shrink-0 truncate text-sm text-muted-foreground" title={item.label}>
              {item.label}
            </span>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-brand"
                style={{ width: `${(item.value / max) * 100}%` }}
              />
            </div>
            <span className="w-8 shrink-0 text-right text-sm font-semibold text-foreground">
              {item.value}
            </span>
          </>
        );
        return (
          <li key={item.label}>
            {item.to ? (
              <Link to={item.to} className="flex items-center gap-3 rounded-lg transition-colors hover:text-foreground">
                {row}
              </Link>
            ) : (
              <div className="flex items-center gap-3">{row}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
