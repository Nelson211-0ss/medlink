import { AnimatedCounter } from '@/components/AnimatedCounter';
import { cn } from '@/lib/utils';

export const DASHBOARD_COLORS = {
  blue: '#2563eb',
  orange: '#ea580c',
  red: '#dc2626',
} as const;

export const DASHBOARD_COLOR_LIST = [
  DASHBOARD_COLORS.blue,
  DASHBOARD_COLORS.red,
  DASHBOARD_COLORS.orange,
  DASHBOARD_COLORS.blue,
] as const;

const CHART_COLORS = DASHBOARD_COLOR_LIST;

/** Consistent recruitment pipeline colors across org dashboard charts */
export const PIPELINE_STAGE_COLORS: Record<string, string> = {
  applied: DASHBOARD_COLORS.blue,
  screening: DASHBOARD_COLORS.orange,
  interview: DASHBOARD_COLORS.orange,
  offer: DASHBOARD_COLORS.red,
  hired: DASHBOARD_COLORS.red,
  rejected: DASHBOARD_COLORS.red,
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
  valueSuffix = '',
  labelClassName,
}: {
  items: ChartItem[];
  className?: string;
  showValues?: boolean;
  valueSuffix?: string;
  labelClassName?: string;
}) {
  const max = Math.max(...items.map((i) => i.value), 1);

  return (
    <div className={cn('space-y-2.5', className)}>
      {items.map((item, i) => {
        const pct = (item.value / max) * 100;
        const color = item.color ?? CHART_COLORS[i % CHART_COLORS.length];
        return (
          <div key={`${item.label}-${i}`}>
            <div className="mb-1 flex items-center justify-between gap-2 text-xs">
              <span
                className={cn('truncate text-slate-600 dark:text-slate-400', labelClassName ?? 'capitalize')}
                title={item.label}
              >
                {item.label}
              </span>
              {showValues && (
                <span className="shrink-0 font-semibold text-slate-900 dark:text-white">
                  <AnimatedCounter end={item.value} suffix={valueSuffix} />
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
  maxBarWidth = 48,
  compact = false,
}: {
  items: ChartItem[];
  className?: string;
  height?: number;
  maxBarWidth?: number;
  compact?: boolean;
}) {
  const max = Math.max(...items.map((i) => i.value), 1);
  const gap = compact ? 10 : 16;
  const barWidth = Math.min(maxBarWidth, Math.max(compact ? 16 : 20, 240 / Math.max(items.length, 1)));
  const labelSize = compact ? 7 : 9;
  const valueSize = compact ? 8 : 10;
  const bottomPad = compact ? 18 : 28;

  return (
    <svg
      viewBox={`0 0 ${items.length * (barWidth + gap) + 16} ${height + bottomPad}`}
      className={cn('w-full', compact && 'max-h-[88px]', className)}
      style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}
      role="img"
      aria-label="Bar chart"
    >
      {items.map((item, i) => {
        const barHeight = Math.max((item.value / max) * (height - 8), item.value > 0 ? (compact ? 4 : 6) : 2);
        const x = 8 + i * (barWidth + gap);
        const y = height - barHeight;
        const color = item.color ?? CHART_COLORS[i % CHART_COLORS.length];
        const labelMax = compact ? 6 : 8;
        return (
          <g key={item.label}>
            <rect x={x} y={y} width={barWidth} height={barHeight} rx={compact ? 3 : 4} fill={color} opacity={0.9} />
            <text x={x + barWidth / 2} y={height + (compact ? 10 : 14)} textAnchor="middle" fill="#64748b" fontSize={labelSize}>
              {item.label.length > labelMax ? `${item.label.slice(0, labelMax - 1)}…` : item.label}
            </text>
            <text
              x={x + barWidth / 2}
              y={y - (compact ? 2 : 4)}
              textAnchor="middle"
              fill="#334155"
              fontSize={valueSize}
              fontWeight={600}
            >
              {item.value}
            </text>
          </g>
        );
      })}
      <line x1="4" y1={height} x2={items.length * (barWidth + gap) + 8} y2={height} stroke="#e2e8f0" strokeWidth="1" />
    </svg>
  );
}

export function DonutChart({
  segments,
  centerLabel,
  centerSub,
  className,
  valueSuffix = '',
  labelMax = 20,
}: {
  segments: ChartItem[];
  centerLabel: string;
  centerSub?: string;
  className?: string;
  valueSuffix?: string;
  labelMax?: number;
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
        className="relative flex h-32 w-32 items-center justify-center rounded-full sm:h-36 sm:w-36"
        style={{ background: `conic-gradient(${gradientStops})` }}
        role="img"
        aria-label={centerLabel}
      >
        <div className="flex h-[5.25rem] w-[5.25rem] flex-col items-center justify-center rounded-full bg-white dark:bg-card sm:h-24 sm:w-24">
          <span className="text-base font-bold text-slate-900 dark:text-white sm:text-lg">{centerLabel}</span>
          {centerSub && <span className="text-[10px] text-slate-500">{centerSub}</span>}
        </div>
      </div>
      <div className="mt-3 w-full space-y-1.5">
        {segments.map((seg, i) => {
          const share = Math.round((seg.value / total) * 100);
          const shortLabel =
            seg.label.length > labelMax ? `${seg.label.slice(0, labelMax - 1)}…` : seg.label;
          const color = seg.color ?? CHART_COLORS[i % CHART_COLORS.length];
          return (
            <div key={`${seg.label}-${i}`} className="flex items-center justify-between gap-2 text-xs">
              <span className="flex min-w-0 items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                <span className="truncate" title={seg.label}>
                  {shortLabel}
                </span>
              </span>
              <span className="shrink-0 font-semibold text-slate-900 dark:text-white">
                {seg.value}
                {valueSuffix}
                <span className="ml-1 font-normal text-slate-400">({share}%)</span>
              </span>
            </div>
          );
        })}
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
