import { cn, titleCase } from '@/lib/utils';

export function OrganizationBadge({
  name,
  logo,
  type,
  className,
  logoClassName,
  nameClassName,
}: {
  name: string;
  logo?: string | null;
  type?: string | null;
  className?: string;
  logoClassName?: string;
  nameClassName?: string;
}) {
  const initial = name.trim().charAt(0).toUpperCase();

  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-primary/15 bg-primary/5',
          logoClassName,
        )}
      >
        {logo ? (
          <img src={logo} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="text-xs font-bold text-primary">{initial}</span>
        )}
      </div>
      <div className={cn('min-w-0', nameClassName)}>
        <p className="truncate font-medium text-primary">{name}</p>
        {type && <p className="text-xs text-muted-foreground">{titleCase(type)}</p>}
      </div>
    </div>
  );
}
