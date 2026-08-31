interface LineChartPoint {
  label: string;
  value: number;
}

interface LineChartProps {
  points: LineChartPoint[];
  unit?: string;
  className?: string;
}

const WIDTH = 600;
const HEIGHT = 220;
const PADDING = 32;

/**
 * Minimal dependency-free SVG line chart for a single trend series (e.g.
 * weight over time). Not a general charting library — just enough to plot
 * a member's vitals history without pulling in a new package.
 */
export function LineChart({ points, unit, className }: LineChartProps) {
  if (points.length < 2) {
    return (
      <div className={className}>
        <p className="py-8 text-center text-sm text-muted-foreground">
          Log at least two readings to see a trend.
        </p>
      </div>
    );
  }

  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const stepX = (WIDTH - PADDING * 2) / (points.length - 1);
  const toXY = (index: number, value: number): [number, number] => {
    const x = PADDING + index * stepX;
    const y = HEIGHT - PADDING - ((value - min) / range) * (HEIGHT - PADDING * 2);
    return [x, y];
  };

  const linePath = points
    .map((p, i) => {
      const [x, y] = toXY(i, p.value);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <div className={className}>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Trend chart">
        <line
          x1={PADDING}
          y1={HEIGHT - PADDING}
          x2={WIDTH - PADDING}
          y2={HEIGHT - PADDING}
          className="stroke-border"
          strokeWidth={1}
        />
        <path d={linePath} fill="none" className="stroke-primary" strokeWidth={2} />
        {points.map((p, i) => {
          const [x, y] = toXY(i, p.value);
          return (
            <g key={`${p.label}-${i}`}>
              <circle cx={x} cy={y} r={3.5} className="fill-primary" />
              <text x={x} y={HEIGHT - PADDING + 16} textAnchor="middle" className="fill-muted-foreground text-[10px]">
                {p.label}
              </text>
            </g>
          );
        })}
        <text x={PADDING} y={PADDING - 12} className="fill-muted-foreground text-[10px]">
          {max.toFixed(1)}
          {unit}
        </text>
        <text x={PADDING} y={HEIGHT - PADDING - 4} className="fill-muted-foreground text-[10px]">
          {min.toFixed(1)}
          {unit}
        </text>
      </svg>
    </div>
  );
}
