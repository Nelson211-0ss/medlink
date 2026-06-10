import { Link } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';

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
    <div className="min-h-screen bg-white">
      <div className="flex min-h-screen flex-col px-6 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Link to="/" className="transition-opacity hover:opacity-80">
            <Logo />
          </Link>
          <ThemeToggle />
        </div>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className={`w-full ${compact ? 'max-w-[300px]' : 'max-w-[420px]'}`}>
            <div
              className={`rounded-2xl border border-slate-200 bg-white shadow-lg ${
                tall ? 'px-6 py-10 sm:px-8 sm:py-12' : compact ? 'p-5 sm:p-6' : 'p-6 sm:p-8'
              }`}
            >
              <div
                className={`space-y-2 text-center ${tall ? 'mb-8' : compact ? 'mb-5' : 'mb-8'}`}
              >
                <h1
                  className={`font-bold tracking-tight text-slate-900 ${
                    tall ? 'text-2xl sm:text-3xl' : compact ? 'text-xl' : 'text-3xl sm:text-[2rem]'
                  }`}
                >
                  {title}
                </h1>
                {subtitle && (
                  <p className={`text-slate-500 ${compact ? 'text-sm' : 'text-base'}`}>{subtitle}</p>
                )}
              </div>
              {children}
            </div>
          </div>
        </div>

        <p className="pb-2 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} MediLink · HIPAA-minded · All 50 states
        </p>
      </div>
    </div>
  );
}
