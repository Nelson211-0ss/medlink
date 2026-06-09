import { Link } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';

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
      <div className="relative hidden gradient-hero lg:flex">
        <div className="m-auto max-w-md p-12">
          <blockquote className="text-2xl font-semibold leading-snug">
            “MediNexus matched our ICU with three qualified nurses in under a week.”
          </blockquote>
          <p className="mt-4 text-muted-foreground">— Director of Nursing, Grace Medical Center</p>
        </div>
      </div>
    </div>
  );
}
