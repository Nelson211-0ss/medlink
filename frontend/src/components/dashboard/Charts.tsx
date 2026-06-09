import { AnimatedCounter } from '@/components/AnimatedCounter';
import { cn } from '@/lib/utils';

const CHART_COLORS = ['#2563eb', '#059669', '#d97706', '#7c3aed', '#e11d48', '#0891b2', '#64748b'] as const;

/** Consistent recruitment pipeline colors across org dashboard charts */
export const PIPELINE_STAGE_COLORS: Record<string, string> = {
  applied: '#2563eb',
  screening: '#0891b2',
  interview: '#d97706',
  offer: '#7c3aed',
  hired: '#059669',
  rejected: '#e11d48',
};

export interface ChartItem {
  label: string;
  value: number;
  color?: string;
}

export function HorizontalBarChart({
  items,
  className,
  showValues = true,
}: {
  items: ChartItem[];
  className?: string;
  showValues?: boolean;
}) {
  const max = Math.max(...items.map((i) => i.value), 1);

  return (
    <div className={cn('space-y-2.5', className)}>
      {items.map((item, i) => {
        const pct = (item.value / max) * 100;
        const color = item.color ?? CHART_COLORS[i % CHART_COLORS.length];
        return (
          <div key={item.label}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="capitalize text-slate-600 dark:text-slate-400">{item.label}</span>
              {showValues && (
                <span className="font-semibold text-slate-900 dark:text-white">
                  <AnimatedCounter end={item.value} />
                </span>
              )}
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, backgroundColor: color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function VerticalBarChart({
  items,
  className,
  height = 120,
}: {
  items: ChartItem[];
  className?: string;
  height?: number;
}) {
  const max = Math.max(...items.map((i) => i.value), 1);
  const barWidth = Math.min(48, Math.max(28, 240 / Math.max(items.length, 1)));

  return (
    <svg
      viewBox={`0 0 ${items.length * (barWidth + 16) + 16} ${height + 28}`}
      className={cn('w-full', className)}
      style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}
      role="img"
      aria-label="Bar chart"
    >
      {items.map((item, i) => {
        const barHeight = Math.max((item.value / max) * (height - 12), item.value > 0 ? 6 : 2);
        const x = 16 + i * (barWidth + 16);
        const y = height - barHeight;
        const color = item.color ?? CHART_COLORS[i % CHART_COLORS.length];
        return (
          <g key={item.label}>
            <rect x={x} y={y} width={barWidth} height={barHeight} rx={4} fill={color} opacity={0.9} />
            <text x={x + barWidth / 2} y={height + 14} textAnchor="middle" fill="#64748b" fontSize={9}>
              {item.label.length > 8 ? `${item.label.slice(0, 7)}…` : item.label}
            </text>
            <text x={x + barWidth / 2} y={y - 4} textAnchor="middle" fill="#334155" fontSize={10} fontWeight={600}>
              {item.value}
            </text>
          </g>
        );
      })}
      <line x1="8" y1={height} x2={items.length * (barWidth + 16) + 8} y2={height} stroke="#e2e8f0" strokeWidth="1" />
    </svg>
  );
}

export function DonutChart({
  segments,
  centerLabel,
  centerSub,
  className,
}: {
  segments: ChartItem[];
  centerLabel: string;
  centerSub?: string;
  className?: string;
}) {
  const total = Math.max(
    segments.reduce((s, seg) => s + seg.value, 0),
    1,
  );

  let offset = 0;
  const gradientStops = segments
    .map((seg, i) => {
      const pct = (seg.value / total) * 100;
      const color = seg.color ?? CHART_COLORS[i % CHART_COLORS.length];
      const start = offset;
      offset += pct;
      return `${color} ${start}% ${offset}%`;
    })
    .join(', ');

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div
        className="relative flex h-28 w-28 items-center justify-center rounded-full"
        style={{ background: `conic-gradient(${gradientStops})` }}
        role="img"
        aria-label={centerLabel}
      >
        <div className="flex h-[4.5rem] w-[4.5rem] flex-col items-center justify-center rounded-full bg-white dark:bg-card">
          <span className="text-sm font-bold text-slate-900 dark:text-white">{centerLabel}</span>
          {centerSub && <span className="text-[9px] text-slate-500">{centerSub}</span>}
        </div>
      </div>
      <div className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1">
        {segments.map((seg, i) => (
          <span key={seg.label} className="flex items-center gap-1 text-[10px] text-slate-500">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: seg.color ?? CHART_COLORS[i % CHART_COLORS.length] }}
            />
            {seg.label} ({seg.value})
          </span>
        ))}
      </div>
    </div>
  );
}

export function PipelineBreakdownChart({
  pipeline,
  stages,
  className,
}: {
  pipeline: Record<string, number>;
  stages: readonly string[];
  className?: string;
}) {
  const total = stages.reduce((sum, stage) => sum + (pipeline[stage] ?? 0), 0);
  const max = Math.max(...stages.map((stage) => pipeline[stage] ?? 0), 1);

  return (
    <div className={cn('grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6', className)}>
      {stages.map((stage) => {
        const count = pipeline[stage] ?? 0;
        const sharePct = total > 0 ? (count / total) * 100 : 0;
        const barPct = count > 0 ? Math.max((count / max) * 100, 12) : 0;
        const color = PIPELINE_STAGE_COLORS[stage] ?? '#64748b';

        return (
          <div
            key={stage}
            className="flex flex-col rounded-lg bg-white p-3 shadow-sm dark:bg-slate-800/50"
          >
            <div className="mb-2 flex h-20 items-end justify-center">
              <div
                className="w-10 rounded-t-md transition-all"
                style={{
                  height: `${barPct}%`,
                  backgroundColor: color,
                  minHeight: count > 0 ? 10 : 4,
                  opacity: count > 0 ? 1 : 0.25,
                }}
              />
            </div>
            <p className="text-center text-xl font-bold text-slate-900 dark:text-white">
              <AnimatedCounter end={count} />
            </p>
            <p className="mt-1 text-center text-[11px] font-medium capitalize text-slate-600 dark:text-slate-400">
              {stage}
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${sharePct}%`, backgroundColor: color }}
              />
            </div>
            <p className="mt-1 text-center text-[10px] text-slate-400">
              {total > 0 ? `${Math.round(sharePct)}%` : '0%'} of pipeline
            </p>
          </div>
        );
      })}
    </div>
  );
}

export function InsightTile({
  label,
  value,
  suffix,
  prefix,
  hint,
  className,
}: {
  label: string;
  value: number | string;
  suffix?: string;
  prefix?: string;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={cn('rounded-lg bg-slate-50 p-3 dark:bg-slate-800/40', className)}>
      <p className="text-[11px] text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
        {typeof value === 'number' ? (
          <>
            {prefix}
            <AnimatedCounter end={value} suffix={suffix} />
          </>
        ) : (
          value
        )}
      </p>
      {hint && <p className="mt-0.5 text-[10px] text-slate-400">{hint}</p>}
    </div>
  );
}
