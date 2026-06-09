import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { images } from '@/lib/images';

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col p-8">
        <div className="flex items-center justify-between">
          <Link to="/">
            <Logo />
          </Link>
          <ThemeToggle />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-md animate-fade-in">
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
            <div className="mt-6">{children}</div>
          </div>
        </div>
      </div>

      <div className="relative hidden overflow-hidden lg:block">
        <img
          src={images.authBackdrop}
          alt="U.S. healthcare professionals at work"
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/95 via-primary/80 to-primary/60" />
        <div className="relative flex h-full flex-col justify-end p-12 text-primary-foreground">
          <blockquote className="text-2xl font-semibold leading-snug">
            “MediLink matched our ICU with three qualified RNs in under a week.”
          </blockquote>
          <p className="mt-4 text-primary-foreground/80">
            — Director of Nursing, Grace Medical Center · Boston, MA
          </p>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-primary-foreground/90">
            {['Verified state licenses', 'All 50 states', 'HIPAA-minded'].map((t) => (
              <span key={t} className="inline-flex items-center gap-1.5">
                <Check className="h-4 w-4" /> {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
