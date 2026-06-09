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
  Star,
  MapPin,
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuthStore } from '@/store/auth';
import { images, avatars } from '@/lib/images';

const features = [
  { icon: Sparkles, title: 'Smart Matching', desc: 'A healthcare-specific engine ranks candidates and jobs by profession, specialty, experience and state licensure.' },
  { icon: Search, title: 'Powerful Search', desc: 'Elasticsearch-backed discovery across skills, specialties, city/state and availability.' },
  { icon: ShieldCheck, title: 'Verified & Compliant', desc: 'License, board certification and facility verification keep the marketplace trustworthy and HIPAA-minded.' },
  { icon: MessageSquare, title: 'Real-time Messaging', desc: 'Chat instantly with read receipts, typing indicators and presence.' },
  { icon: TrendingUp, title: 'Recruitment Pipeline', desc: 'Track applicants from applied to hired with a visual hiring pipeline.' },
  { icon: Stethoscope, title: 'Built for Healthcare', desc: 'RNs, physicians, pharmacists, lab techs, radiologic techs, NPs, PAs, therapists and more.' },
];

const stats = [
  { value: '50k+', label: 'Healthcare professionals' },
  { value: '2,400+', label: 'Verified facilities' },
  { value: '120k+', label: 'Successful matches' },
  { value: '50', label: 'U.S. states covered' },
];

const testimonials = [
  {
    quote: 'MediLink matched our ICU with three qualified RNs in under a week. The license verification alone saved our recruiters days.',
    name: 'Director of Nursing',
    org: 'Grace Medical Center · Boston, MA',
    avatar: avatars.maria,
  },
  {
    quote: 'I found a cardiology role in New York that actually fit my subspecialty and pay expectations. The match score was spot on.',
    name: 'David Nguyen, MD',
    org: 'Cardiologist · New York, NY',
    avatar: avatars.david,
  },
];

const logos = ['Mass General Brigham', 'Cleveland Clinic', 'Kaiser Permanente', 'HCA Healthcare', 'Mayo Clinic'];

export default function Landing() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b bg-background/70 backdrop-blur-lg">
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
        <div className="container grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
          <div className="animate-fade-in">
            <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
              <span className="h-2 w-2 rounded-full bg-secondary" />
              The U.S. healthcare workforce marketplace
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
              Connecting healthcare <span className="text-primary">talent</span> with{' '}
              <span className="text-secondary">opportunity</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              MediLink brings the best of LinkedIn, Indeed and Upwork — with smart, Tinder-style
              matching — to healthcare recruitment across all 50 states. Find your next role or your
              next hire.
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
              {['Free to start', 'Verified state licenses', 'No spam'].map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-secondary" /> {t}
                </span>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-2xl shadow-2xl ring-1 ring-black/5">
              <img
                src={images.heroTeam}
                alt="A diverse team of U.S. healthcare professionals"
                className="h-[420px] w-full object-cover"
                loading="eager"
              />
            </div>
            {/* Floating match card */}
            <Card className="absolute -bottom-6 -left-4 w-72 animate-fade-in shadow-xl sm:-left-6">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={avatars.ashley}
                      alt="Ashley Carter"
                      className="h-11 w-11 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-sm font-semibold">Ashley Carter</p>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" /> ICU Nurse · Boston, MA
                      </p>
                    </div>
                  </div>
                  <div className="rounded-full bg-secondary/10 px-2.5 py-1 text-xs font-bold text-secondary">
                    92%
                  </div>
                </div>
                <div className="mt-3 space-y-1.5">
                  {['ICU specialization', 'ACLS certified', 'Available now'].map((r) => (
                    <div key={r} className="flex items-center gap-2 rounded-md bg-muted px-2.5 py-1.5 text-xs">
                      <Check className="h-3.5 w-3.5 text-secondary" /> {r}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-y bg-card">
        <div className="container py-8">
          <p className="text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Trusted by leading U.S. health systems
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-sm font-semibold text-muted-foreground/70">
            {logos.map((l) => (
              <span key={l}>{l}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="container grid grid-cols-2 gap-6 py-12 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <p className="text-3xl font-extrabold text-primary sm:text-4xl">{s.value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </section>

      {/* Two-up audience section */}
      <section className="container grid gap-6 pb-4 lg:grid-cols-2">
        {[
          {
            img: images.doctor,
            tag: 'For professionals',
            title: 'Get hired by top U.S. facilities',
            desc: 'Build a verified profile, surface in smart matches, and apply in one click — from RNs to physicians.',
            cta: 'Join as professional',
          },
          {
            img: images.teamHuddle,
            tag: 'For organizations',
            title: 'Fill roles faster, with confidence',
            desc: 'Source pre-verified candidates, manage a visual hiring pipeline, and message talent in real time.',
            cta: 'Hire talent',
          },
        ].map((c) => (
          <Card key={c.tag} className="group overflow-hidden">
            <div className="relative h-56 overflow-hidden">
              <img
                src={c.img}
                alt={c.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <span className="absolute left-4 top-4 rounded-full bg-background/90 px-3 py-1 text-xs font-semibold backdrop-blur">
                {c.tag}
              </span>
            </div>
            <CardContent className="p-6">
              <h3 className="text-xl font-bold">{c.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{c.desc}</p>
              <Button className="mt-4" variant="outline" asChild>
                <Link to="/register">
                  {c.cta} <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Features */}
      <section className="container py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight">Everything you need to recruit and get hired</h2>
          <p className="mt-3 text-muted-foreground">
            An enterprise-grade platform purpose-built for U.S. healthcare.
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

      {/* Testimonials */}
      <section className="border-y bg-card">
        <div className="container py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">Loved by clinicians and recruiters</h2>
            <div className="mt-3 flex items-center justify-center gap-1 text-secondary">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-current" />
              ))}
              <span className="ml-2 text-sm text-muted-foreground">4.9/5 average rating</span>
            </div>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {testimonials.map((t) => (
              <Card key={t.name}>
                <CardContent className="p-6">
                  <p className="text-lg font-medium leading-snug">“{t.quote}”</p>
                  <div className="mt-5 flex items-center gap-3">
                    <img src={t.avatar} alt={t.name} className="h-11 w-11 rounded-full object-cover" />
                    <div>
                      <p className="text-sm font-semibold">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.org}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container py-20">
        <Card className="relative overflow-hidden border-0">
          <img
            src={images.surgeons}
            alt="Surgical team in a U.S. operating room"
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-primary/85" />
          <CardContent className="relative flex flex-col items-center gap-6 p-12 text-center text-primary-foreground">
            <h2 className="max-w-2xl text-3xl font-bold">Ready to transform your healthcare career or team?</h2>
            <p className="max-w-xl text-primary-foreground/80">
              Join thousands of U.S. professionals and facilities already hiring smarter on MediLink.
            </p>
            <Button size="lg" variant="secondary" asChild>
              <Link to="/register">Create your free account</Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <footer className="border-t py-8">
        <div className="container flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
          <Logo />
          <p>© {new Date().getFullYear()} MediLink. Connecting healthcare talent with opportunity.</p>
        </div>
      </footer>
    </div>
  );
}
