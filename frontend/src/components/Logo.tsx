import { cn } from '@/lib/utils';

export function Logo({ className, showText = true }: { className?: string; showText?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
        <span className="text-lg font-bold leading-none">+</span>
        <span className="absolute h-1.5 w-1.5 rounded-full bg-secondary" />
      </div>
      {showText && (
        <span className="text-lg font-extrabold tracking-tight">
          Medi<span className="text-primary">Nexus</span>
        </span>
      )}
    </div>
  );
}
