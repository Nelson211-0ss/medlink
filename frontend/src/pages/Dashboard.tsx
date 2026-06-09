import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  FileText,
  Users,
  Eye,
  Sparkles,
  Bell,
  TrendingUp,
  CheckCircle2,
  Target,
  Clock,
  BarChart3,
} from 'lucide-react';
import { api, ApiEnvelope } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress, PageLoader } from '@/components/ui/misc';
import { Button } from '@/components/ui/button';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { titleCase } from '@/lib/utils';

interface ProDash {
  profileCompletion: number;
  verificationStatus: string;
  applications: number;
  recommendedJobs: { job: { id: string; title: string; city?: string }; matchScore: number; reasons: string[] }[];
  savedJobs: number;
  invitations: number;
  unreadNotifications: number;
}
interface OrgDash {
  verificationStatus: string;
  totalJobs: number;
  applications: number;
  candidateMatches: number;
  profileViews: number;
  pipeline: Record<string, number>;
  unreadNotifications: number;
}
interface AdminStats {
  totalUsers: number;
  totalProfessionals: number;
  totalOrganizations: number;
  verifiedProfessionals: number;
  activeJobs: number;
  paidSubscriptions: number;
  estimatedMRR: number;
}

function StatCard({
  icon: Icon,
  label,
  value,
  numeric,
  prefix,
  suffix,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  value?: React.ReactNode;
  numeric?: number;
  prefix?: string;
  suffix?: string;
  sub?: string;
}) {
  return (
    <Card className="border-primary/10">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          {sub && <span className="text-xs font-medium text-primary/60">{sub}</span>}
        </div>
        <p className="mt-4 text-3xl font-bold text-primary">
          {numeric !== undefined ? (
            <AnimatedCounter end={numeric} prefix={prefix} suffix={suffix} />
          ) : (
            value
          )}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const user = useAuthStore((s) => s.user)!;

  const endpoint =
    user.role === 'admin'
      ? '/admin/stats'
      : user.role === 'organization'
        ? '/dashboard/organization'
        : '/dashboard/professional';

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', user.role],
    queryFn: async () => (await api.get<ApiEnvelope<unknown>>(endpoint)).data.data,
  });

  if (isLoading) return <PageLoader />;

  return (
    <div className="relative space-y-8">
      <div className="rounded-2xl border border-primary/10 bg-primary/5 p-6 sm:p-8">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Welcome back, {user.firstName}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {user.role === 'professional' && 'Track applications, matches, and profile strength.'}
          {user.role === 'organization' && 'Monitor hiring pipeline, applicants, and facility reach.'}
          {user.role === 'admin' && 'Platform overview — users, jobs, revenue and verification.'}
        </p>
      </div>

      {user.role === 'professional' && <ProfessionalDashboard d={data as ProDash} />}
      {user.role === 'organization' && <OrganizationDashboard d={data as OrgDash} />}
      {user.role === 'admin' && <AdminDashboard d={data as AdminStats} />}
    </div>
  );
}

function ProfessionalDashboard({ d }: { d: ProDash }) {
  const avgMatch =
    d.recommendedJobs?.length
      ? Math.round(d.recommendedJobs.reduce((s, j) => s + j.matchScore, 0) / d.recommendedJobs.length)
      : 0;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={FileText} label="Applications submitted" numeric={d.applications} />
        <StatCard icon={Bell} label="Invitations received" numeric={d.invitations} sub="This month" />
        <StatCard icon={Briefcase} label="Saved jobs" numeric={d.savedJobs} />
        <StatCard icon={Target} label="Avg. match score" numeric={avgMatch} suffix="%" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={BarChart3} label="Profile completion" numeric={d.profileCompletion} suffix="%" />
        <StatCard icon={Bell} label="Unread notifications" numeric={d.unreadNotifications} />
        <StatCard
          icon={CheckCircle2}
          label="Verification status"
          value={
            <Badge variant={d.verificationStatus === 'verified' ? 'default' : 'outline'}>
              {titleCase(d.verificationStatus)}
            </Badge>
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-primary/10 lg:col-span-1">
          <CardHeader>
            <CardTitle>Profile strength</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={d.profileCompletion} />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Completion</span>
              <span className="font-semibold text-primary">
                <AnimatedCounter end={d.profileCompletion} suffix="%" />
              </span>
            </div>
            <Button variant="outline" className="w-full" asChild>
              <Link to="/profile">Complete your profile</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-primary/10 lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> Top job matches
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {d.recommendedJobs?.length ? (
              d.recommendedJobs.map((m) => (
                <Link
                  key={m.job.id}
                  to={`/jobs/${m.job.id}`}
                  className="flex items-center justify-between rounded-xl border border-primary/10 p-4 transition-colors hover:bg-primary/5"
                >
                  <div>
                    <p className="font-medium">{m.job.title}</p>
                    <p className="text-sm text-muted-foreground">{m.reasons?.slice(0, 2).join(' · ')}</p>
                  </div>
                  <Badge variant="default">
                    <AnimatedCounter end={m.matchScore} suffix="%" />
                  </Badge>
                </Link>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Complete your profile to get matched.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

const PIPELINE_STAGES = ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected'];

function OrganizationDashboard({ d }: { d: OrgDash }) {
  const pipelineTotal = PIPELINE_STAGES.reduce((s, stage) => s + (d.pipeline?.[stage] ?? 0), 0);
  const hired = d.pipeline?.hired ?? 0;
  const hireRate = pipelineTotal > 0 ? Math.round((hired / pipelineTotal) * 100) : 0;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Briefcase} label="Open job postings" numeric={d.totalJobs} />
        <StatCard icon={FileText} label="Total applications" numeric={d.applications} />
        <StatCard icon={Users} label="Candidate matches" numeric={d.candidateMatches} />
        <StatCard icon={Eye} label="Facility profile views" numeric={d.profileViews} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={TrendingUp} label="Hire conversion rate" numeric={hireRate} suffix="%" />
        <StatCard icon={Clock} label="Candidates in pipeline" numeric={pipelineTotal} />
        <StatCard icon={Bell} label="Unread notifications" numeric={d.unreadNotifications} />
      </div>

      <Card className="border-primary/10">
        <CardHeader>
          <CardTitle>Recruitment pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {PIPELINE_STAGES.map((stage) => {
              const count = d.pipeline?.[stage] ?? 0;
              const pct = pipelineTotal > 0 ? (count / pipelineTotal) * 100 : 0;
              return (
                <div key={stage} className="rounded-xl border border-primary/10 p-4 text-center">
                  <p className="text-2xl font-bold text-primary">
                    <AnimatedCounter end={count} />
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">{stage}</p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-primary/10">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button asChild>
          <Link to="/jobs">Post a job</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/candidates">Find talent</Link>
        </Button>
      </div>
    </>
  );
}

function AdminDashboard({ d }: { d: AdminStats }) {
  const verificationRate =
    d.totalProfessionals > 0 ? Math.round((d.verifiedProfessionals / d.totalProfessionals) * 100) : 0;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Total platform users" numeric={d.totalUsers} />
        <StatCard icon={Users} label="Healthcare organizations" numeric={d.totalOrganizations} />
        <StatCard icon={CheckCircle2} label="Verified professionals" numeric={d.verifiedProfessionals} />
        <StatCard icon={Briefcase} label="Active job listings" numeric={d.activeJobs} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Total professionals" numeric={d.totalProfessionals} />
        <StatCard icon={TrendingUp} label="Paid subscriptions" numeric={d.paidSubscriptions} />
        <StatCard
          icon={TrendingUp}
          label="Estimated MRR"
          numeric={d.estimatedMRR}
          prefix="$"
        />
        <StatCard icon={BarChart3} label="Verification rate" numeric={verificationRate} suffix="%" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-primary/10">
          <CardHeader>
            <CardTitle>User breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: 'Professionals', value: d.totalProfessionals, total: d.totalUsers },
              { label: 'Organizations', value: d.totalOrganizations, total: d.totalUsers },
              { label: 'Verified pros', value: d.verifiedProfessionals, total: d.totalProfessionals },
            ].map((row) => (
              <div key={row.label}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{row.label}</span>
                  <span className="font-semibold text-primary">
                    <AnimatedCounter end={row.value} />
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-primary/10">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${row.total > 0 ? (row.value / row.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-primary/10">
          <CardHeader>
            <CardTitle>Revenue snapshot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">Monthly recurring revenue</span>
              <span className="text-3xl font-bold text-primary">
                $<AnimatedCounter end={d.estimatedMRR} />
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">Paying subscribers</span>
              <span className="text-xl font-semibold text-primary">
                <AnimatedCounter end={d.paidSubscriptions} />
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">Active jobs</span>
              <span className="text-xl font-semibold text-primary">
                <AnimatedCounter end={d.activeJobs} />
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Button asChild>
        <Link to="/admin">Open admin panel</Link>
      </Button>
    </>
  );
}
