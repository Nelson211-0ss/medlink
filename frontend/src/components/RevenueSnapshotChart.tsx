import { AnimatedCounter } from '@/components/AnimatedCounter';

interface RevenueSnapshotChartProps {
  estimatedMRR: number;
  paidSubscriptions: number;
  activeJobs: number;
  totalUsers: number;
  compact?: boolean;
}

import { DASHBOARD_COLORS } from '@/components/dashboard/Charts';

const BAR_COLORS = [DASHBOARD_COLORS.blue, DASHBOARD_COLORS.red, DASHBOARD_COLORS.orange] as const;

export function RevenueSnapshotChart({
  estimatedMRR,
  paidSubscriptions,
  activeJobs,
  totalUsers,
  compact = false,
}: RevenueSnapshotChartProps) {
  const freeUsers = Math.max(totalUsers - paidSubscriptions, 0);
  const barMetrics = [
    { label: 'MRR', value: estimatedMRR, prefix: '$', color: BAR_COLORS[0] },
    { label: 'Paid subs', value: paidSubscriptions, color: BAR_COLORS[1] },
    { label: 'Active jobs', value: activeJobs, color: BAR_COLORS[2] },
  ];
  const barMax = Math.max(...barMetrics.map((m) => m.value), 1);

  const donutTotal = Math.max(paidSubscriptions + freeUsers, 1);
  const paidPct = Math.round((paidSubscriptions / donutTotal) * 100);

  return (
    <div className={compact ? 'space-y-2' : 'space-y-4'}>
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">MRR</p>
          <p className={compact ? 'text-lg font-bold text-slate-900 dark:text-white' : 'text-2xl font-bold text-slate-900 dark:text-white'}>
            $<AnimatedCounter end={estimatedMRR} />
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">Paid subs</p>
          <p className={compact ? 'text-base font-semibold text-slate-900 dark:text-white' : 'text-lg font-semibold text-slate-900 dark:text-white'}>
            <AnimatedCounter end={paidSubscriptions} />
          </p>
        </div>
      </div>

      <div className={compact ? 'grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center' : 'grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center'}>
        <div>
          {!compact && <p className="mb-2 text-xs font-medium text-slate-500">Revenue drivers</p>}
          <svg
            viewBox="0 0 280 120"
            className={compact ? 'h-20 w-full' : 'h-28 w-full'}
            style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}
            role="img"
            aria-label="Revenue metrics bar chart"
          >
            {barMetrics.map((m, i) => {
              const barHeight = Math.max((m.value / barMax) * 88, m.value > 0 ? 8 : 2);
              const x = 24 + i * 88;
              const y = 100 - barHeight;
              return (
                <g key={m.label}>
                  <rect x={x} y={y} width={48} height={barHeight} rx={6} fill={m.color} opacity={0.9} />
                  <text
                    x={x + 24}
                    y={112}
                    textAnchor="middle"
                    fill="#64748b"
                    fontSize={9}
                  >
                    {m.label}
                  </text>
                  <text
                    x={x + 24}
                    y={y - 6}
                    textAnchor="middle"
                    fill="#334155"
                    fontSize={10}
                    fontWeight={600}
                  >
                    {m.prefix}
                    {m.value}
                  </text>
                </g>
              );
            })}
            <line x1="12" y1="100" x2="268" y2="100" stroke="#e2e8f0" strokeWidth="1" />
          </svg>
        </div>

        {/* Donut chart */}
        <div className="flex flex-col items-center">
          {!compact && <p className="mb-1 text-xs font-medium text-slate-500">User mix</p>}
          <div
            className={compact ? 'relative flex h-20 w-20 items-center justify-center rounded-full' : 'relative flex h-28 w-28 items-center justify-center rounded-full'}
            style={{
              background: `conic-gradient(${DASHBOARD_COLORS.blue} 0% ${paidPct}%, ${DASHBOARD_COLORS.orange} ${paidPct}% 100%)`,
            }}
            role="img"
            aria-label={`Paid users ${paidPct} percent`}
          >
            <div className={compact ? 'flex h-12 w-12 flex-col items-center justify-center rounded-full bg-white dark:bg-card' : 'flex h-[4.5rem] w-[4.5rem] flex-col items-center justify-center rounded-full bg-white dark:bg-card'}>
              <span className={compact ? 'text-xs font-bold text-slate-900 dark:text-white' : 'text-sm font-bold text-slate-900 dark:text-white'}>{paidPct}%</span>
              {!compact && <span className="text-[9px] text-slate-500">paid</span>}
            </div>
          </div>
          <div className={compact ? 'mt-1 flex gap-2 text-[9px] text-slate-500' : 'mt-2 flex gap-3 text-[10px] text-slate-500'}>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-blue-600" />
              Paid ({paidSubscriptions})
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-slate-400" />
              Free ({freeUsers})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
