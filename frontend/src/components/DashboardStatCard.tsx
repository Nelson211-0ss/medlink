import { AnimatedCounter } from '@/components/AnimatedCounter';
import { cn } from '@/lib/utils';

const ICON_STYLES = [
  'dash-stat-icon-blue',
  'dash-stat-icon-red',
  'dash-stat-icon-orange',
  'dash-stat-icon-red',
] as const;

export function DashboardStatCard({
  icon: Icon,
  label,
  value,
  numeric,
  prefix,
  suffix,
  sub,
  colorIndex = 0,
  className,
}: {
  icon?: React.ElementType;
  label: string;
  value?: React.ReactNode;
  numeric?: number;
  prefix?: string;
  suffix?: string;
  sub?: string;
  colorIndex?: number;
  className?: string;
}) {
  return (
    <div className={cn('dash-stat-card bg-white dark:bg-card', className)}>
      <div className="flex items-start justify-between gap-1">
        {Icon && (
          <div className={cn('dash-stat-icon', ICON_STYLES[colorIndex % ICON_STYLES.length])}>
            <Icon className="h-4 w-4" />
          </div>
        )}
        {sub && <span className="text-[9px] font-medium leading-tight text-slate-400">{sub}</span>}
      </div>
      <p className="mt-2 text-xl font-bold leading-tight text-slate-900 dark:text-white">
        {numeric !== undefined ? (
          <AnimatedCounter end={numeric} prefix={prefix} suffix={suffix} />
        ) : (
          value
        )}
      </p>
      <p className="mt-1 text-[11px] leading-snug text-slate-600 dark:text-slate-400">{label}</p>
    </div>
  );
}
