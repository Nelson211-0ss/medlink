import { Link } from 'react-router-dom';
import {
  Stethoscope,
  Search,
  Sparkles,
  ShieldCheck,
  MessageSquare,
  TrendingUp,
  ArrowRight,
  Check,
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuthStore } from '@/store/auth';

const features = [
  { icon: Sparkles, title: 'Smart Matching', desc: 'A healthcare-specific engine ranks candidates and jobs by profession, specialty, experience and licensing.' },
  { icon: Search, title: 'Powerful Search', desc: 'Elasticsearch-backed discovery across skills, specialties, location and availability.' },
  { icon: ShieldCheck, title: 'Verified & Compliant', desc: 'License, certification and organization verification keep the marketplace trustworthy.' },
  { icon: MessageSquare, title: 'Real-time Messaging', desc: 'Chat instantly with read receipts, typing indicators and presence.' },
  { icon: TrendingUp, title: 'Recruitment Pipeline', desc: 'Track applicants from applied to hired with a visual hiring pipeline.' },
  { icon: Stethoscope, title: 'Built for Healthcare', desc: 'Nurses, doctors, pharmacists, lab techs, radiographers, midwives and more.' },
];

const stats = [
  { value: '50k+', label: 'Healthcare professionals' },
  { value: '2,400+', label: 'Verified organizations' },
  { value: '120k+', label: 'Successful matches' },
  { value: '40+', label: 'Countries' },
];

export default function Landing() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Logo />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {user ? (
              <Button asChild>
                <Link to="/dashboard">Go to dashboard</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/login">Sign in</Link>
                </Button>
                <Button asChild>
                  <Link to="/register">Get started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="gradient-hero">
        <div className="container grid items-center gap-10 py-20 lg:grid-cols-2">
          <div className="animate-fade-in">
            <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-secondary" />
              The healthcare workforce marketplace
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Connecting healthcare <span className="text-primary">talent</span> with{' '}
              <span className="text-secondary">opportunity</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              MediNexus brings the best of LinkedIn, Indeed and Upwork — with smart Tinder-style
              matching — to healthcare recruitment. Find your next role or your next hire.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link to="/register">
                  Join as professional <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/register">Hire talent</Link>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-8 gap-y-2 text-sm text-muted-foreground">
              {['Free to start', 'Verified licenses', 'No spam'].map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-secondary" /> {t}
                </span>
              ))}
            </div>
          </div>

          <div className="relative hidden lg:block">
            <Card className="rotate-2 animate-fade-in shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">AN</div>
                    <div>
                      <p className="font-semibold">Aisha Nakato</p>
                      <p className="text-sm text-muted-foreground">ICU Nurse · Kampala</p>
                    </div>
                  </div>
                  <div className="rounded-full bg-secondary/10 px-3 py-1 text-sm font-bold text-secondary">
                    92% match
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  {['ICU specialization', '5 years experience', 'Located in Kampala'].map((r) => (
                    <div key={r} className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm">
                      <Check className="h-4 w-4 text-secondary" /> {r}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y bg-card">
        <div className="container grid grid-cols-2 gap-6 py-10 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-extrabold text-primary">{s.value}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="container py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight">Everything you need to recruit and get hired</h2>
          <p className="mt-3 text-muted-foreground">
            An enterprise-grade platform purpose-built for healthcare.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title} className="transition-shadow hover:shadow-md">
              <CardContent className="p-6">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container pb-20">
        <Card className="overflow-hidden bg-primary text-primary-foreground">
          <CardContent className="flex flex-col items-center gap-6 p-12 text-center">
            <h2 className="max-w-2xl text-3xl font-bold">Ready to transform your healthcare career or team?</h2>
            <Button size="lg" variant="secondary" asChild>
              <Link to="/register">Create your free account</Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <footer className="border-t py-8">
        <div className="container flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
          <Logo />
          <p>© {new Date().getFullYear()} MediNexus. Connecting healthcare talent with opportunity.</p>
        </div>
      </footer>
    </div>
  );
}
