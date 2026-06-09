import { cn } from '@/lib/utils';

const sizes = {
  default: {
    icon: 'h-8 w-8 rounded-lg',
    plus: 'text-lg',
    dot: 'h-1.5 w-1.5',
    text: 'text-lg',
  },
  lg: {
    icon: 'h-12 w-12 rounded-xl',
    plus: 'text-2xl',
    dot: 'h-2 w-2',
    text: 'text-2xl sm:text-3xl',
  },
} as const;

export function Logo({
  className,
  showText = true,
  size = 'default',
}: {
  className?: string;
  showText?: boolean;
  size?: keyof typeof sizes;
}) {
  const s = sizes[size];

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div
        className={cn(
          'relative flex items-center justify-center bg-primary text-white shadow-sm',
          s.icon,
        )}
      >
        <span className={cn('font-bold leading-none', s.plus)}>+</span>
        <span className={cn('absolute bottom-1.5 right-1.5 rounded-full bg-white/90', s.dot)} />
      </div>
      {showText && (
        <span className={cn('font-extrabold tracking-tight', s.text)}>
          Medi<span className="text-primary">Link</span>
        </span>
      )}
    </div>
  );
}
