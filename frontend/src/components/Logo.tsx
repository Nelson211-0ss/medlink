import { cn } from '@/lib/utils';

export function Logo({ className, showText = true }: { className?: string; showText?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary text-white shadow-sm">
        <span className="text-lg font-bold leading-none">+</span>
        <span className="absolute bottom-1 right-1 h-1.5 w-1.5 rounded-full bg-white/90" />
      </div>
      {showText && (
        <span className="text-lg font-extrabold tracking-tight">
          Medi<span className="text-primary">Link</span>
        </span>
      )}
    </div>
  );
}
