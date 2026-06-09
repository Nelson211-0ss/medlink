import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { images } from '@/lib/images';

export function AuthShell({
  title,
  subtitle,
  children,
  compact,
  tall,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  compact?: boolean;
  tall?: boolean;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <img
        src={images.authBackdrop}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover"
        loading="eager"
      />
      <div className="absolute inset-0 bg-slate-950/75" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-slate-950/30" />

      <div className="relative flex min-h-screen flex-col px-6 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Link to="/" className="transition-opacity hover:opacity-80">
            <Logo className="[&_span]:text-white" />
          </Link>
          <ThemeToggle />
        </div>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className={`w-full animate-fade-in ${compact ? 'max-w-[300px]' : 'max-w-[420px]'}`}>
            <div
              className={`rounded-2xl border border-white/20 bg-white/95 shadow-2xl backdrop-blur-md dark:border-slate-700/50 dark:bg-slate-900/95 ${
                tall ? 'px-6 py-10 sm:px-8 sm:py-12' : compact ? 'p-5 sm:p-6' : 'p-6 sm:p-8'
              }`}
            >
              <div
                className={`space-y-2 text-center ${tall ? 'mb-8' : compact ? 'mb-5' : 'mb-8'}`}
              >
                <div className="mx-auto inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-0.5 text-[11px] font-medium text-primary">
                  <Sparkles className="h-3 w-3" />
                  Healthcare workforce platform
                </div>
                <h1
                  className={`font-bold tracking-tight text-slate-900 dark:text-white ${
                    tall ? 'text-2xl sm:text-3xl' : compact ? 'text-xl' : 'text-3xl sm:text-[2rem]'
                  }`}
                >
                  {title}
                </h1>
                {subtitle && (
                  <p className={`text-slate-500 dark:text-slate-400 ${compact ? 'text-sm' : 'text-base'}`}>
                    {subtitle}
                  </p>
                )}
              </div>
              {children}
            </div>
          </div>
        </div>

        <p className="pb-2 text-center text-xs text-white/40">
          © {new Date().getFullYear()} MediLink · HIPAA-minded · All 50 states
        </p>
      </div>
    </div>
  );
}
