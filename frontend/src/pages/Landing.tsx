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
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NurseSlider } from '@/components/NurseSlider';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { useAuthStore } from '@/store/auth';
import { images, avatars } from '@/lib/images';

const features = [
  { icon: Sparkles, title: 'Smart Matching', desc: 'Rank candidates and jobs by profession, specialty, experience and state licensure.' },
  { icon: Search, title: 'Powerful Search', desc: 'Discover talent across skills, specialties, city/state and availability.' },
  { icon: ShieldCheck, title: 'Verified & Compliant', desc: 'License, board certification and facility verification you can trust.' },
  { icon: MessageSquare, title: 'Real-time Messaging', desc: 'Chat instantly with read receipts, typing indicators and presence.' },
  { icon: TrendingUp, title: 'Recruitment Pipeline', desc: 'Track applicants from applied to hired with a visual hiring pipeline.' },
  { icon: Stethoscope, title: 'Built for Healthcare', desc: 'RNs, physicians, pharmacists, lab techs, NPs, PAs, therapists and more.' },
];

const stats = [
  { end: 50000, suffix: '+', label: 'Healthcare professionals', compact: true },
  { end: 2400, suffix: '+', label: 'Verified facilities', compact: true },
  { end: 120000, suffix: '+', label: 'Successful matches', compact: true },
  { end: 50, suffix: '', label: 'U.S. states covered', compact: false },
];

const testimonials = [
  {
    quote: 'MediLink matched our ICU with three qualified RNs in under a week. License verification alone saved our recruiters days.',
    name: 'Director of Nursing',
    org: 'Grace Medical Center · Boston, MA',
    avatar: avatars.maria,
  },
  {
    quote: 'I found a cardiology role in New York that fit my subspecialty and pay expectations. The match score was spot on.',
    name: 'David Nguyen, MD',
    org: 'Cardiologist · New York, NY',
    avatar: avatars.david,
  },
];

const logos = ['Mass General Brigham', 'Cleveland Clinic', 'Kaiser Permanente', 'HCA Healthcare', 'Mayo Clinic'];

export default function Landing() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="relative z-10 min-h-screen">
      <header className="sticky top-0 z-30 border-b border-primary/10 bg-white/80 backdrop-blur-lg">
        <div className="container relative z-10 flex h-16 items-center justify-between">
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
      <section className="gradient-hero relative overflow-x-hidden">
        <div className="container relative z-10 grid items-center gap-10 py-14 sm:py-16 lg:grid-cols-2 lg:gap-12 lg:py-16 xl:py-20">
          <div className="animate-slide-up flex flex-col justify-center pt-8 sm:pt-10 lg:py-12 lg:pr-6 xl:pr-10">
            <h1 className="flex flex-col gap-1 text-3xl font-extrabold tracking-tight text-foreground sm:gap-1.5 sm:text-4xl lg:text-[2.85rem]">
              <span>Connecting</span>
              <span>
                Healthcare <span className="text-primary">Talent</span> With
              </span>
              <span className="text-primary">Opportunity</span>
            </h1>
            <p className="mt-4 max-w-md text-base text-muted-foreground sm:text-lg">
              MediLink brings smart matching to healthcare recruitment across all 50 states.
              Find your next role or your next hire.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link to="/register">
                  Join as professional <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/register">Hire talent</Link>
              </Button>
            </div>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {['Free to start', 'Verified state licenses', 'No spam'].map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-primary" /> {t}
                </span>
              ))}
            </div>
          </div>

          <div
            className="animate-slide-up flex min-h-[min(58vh,560px)] items-center justify-center overflow-visible sm:min-h-[min(62vh,620px)] lg:min-h-[640px]"
            style={{ animationDelay: '0.15s' }}
          >
            <NurseSlider className="h-full w-full" />
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-y border-primary/10 bg-white">
        <div className="container py-8">
          <p className="text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Trusted by leading U.S. health systems
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-sm font-semibold text-primary/50">
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
            <p className="text-3xl font-extrabold text-primary sm:text-4xl">
              <AnimatedCounter end={s.end} suffix={s.suffix} compact={s.compact} />
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </section>

      {/* Audience */}
      <section className="container grid gap-6 pb-4 lg:grid-cols-2">
        {[
          {
            img: images.doctor,
            tag: 'For professionals',
            title: 'Get hired by top U.S. facilities',
            desc: 'Build a verified profile, surface in smart matches, and apply in one click.',
            cta: 'Join as professional',
          },
          {
            img: images.teamHuddle,
            tag: 'For organizations',
            title: 'Fill roles faster, with confidence',
            desc: 'Source pre-verified candidates and manage a visual hiring pipeline.',
            cta: 'Hire talent',
          },
        ].map((c) => (
          <Card key={c.tag} className="overflow-hidden border-primary/10">
            <div className="relative h-52 overflow-hidden bg-primary/5">
              <img src={c.img} alt={c.title} className="h-full w-full object-cover opacity-90" loading="lazy" />
              <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-primary">
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
          <p className="mt-3 text-muted-foreground">Purpose-built for U.S. healthcare.</p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title} className="border-primary/10 transition-shadow hover:shadow-md">
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
      <section className="border-y border-primary/10 bg-primary/5">
        <div className="container py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">Loved by clinicians and recruiters</h2>
            <div className="mt-3 flex items-center justify-center gap-1 text-primary">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-current" />
              ))}
              <span className="ml-2 text-sm text-muted-foreground">4.9/5 average rating</span>
            </div>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {testimonials.map((t) => (
              <Card key={t.name} className="border-primary/10 bg-white">
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

      <footer className="bg-primary text-primary-foreground">
        <div className="container px-6 py-16 text-center sm:px-8 sm:py-20">
          <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to transform your healthcare career or team?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-white/85 sm:text-lg">
            Join thousands of U.S. professionals and facilities already hiring smarter on MediLink.
          </p>
          <Button
            size="lg"
            className="mt-8 border-0 bg-white text-primary shadow-lg hover:bg-white/90"
            asChild
          >
            <Link to="/register">Create your free account</Link>
          </Button>
        </div>

        <div className="border-t border-white/20">
          <div className="container flex flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-white/75 sm:flex-row sm:px-8">
            <Logo className="[&>div]:bg-white [&>div]:text-primary [&_span]:text-white" />
            <p>© {new Date().getFullYear()} MediLink. Connecting healthcare talent with opportunity.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
