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
import { DashboardStatCard } from '@/components/DashboardStatCard';
import { RevenueSnapshotChart } from '@/components/RevenueSnapshotChart';
import {
  DonutChart,
  HorizontalBarChart,
  InsightTile,
  PIPELINE_STAGE_COLORS,
  PipelineBreakdownChart,
} from '@/components/dashboard/Charts';
import { titleCase } from '@/lib/utils';

interface ProDash {
  profileCompletion: number;
  verificationStatus: string;
  applications: number;
  applicationPipeline?: Record<string, number>;
  activeApplications?: number;
  offersReceived?: number;
  recommendedJobs: { job: { id: string; title: string; city?: string }; matchScore: number; reasons: string[] }[];
  savedJobs: number;
  invitations: number;
  unreadNotifications: number;
}
interface OrgDash {
  verificationStatus: string;
  totalJobs: number;
  totalJobsPosted?: number;
  closedJobs?: number;
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
  unverifiedProfessionals?: number;
  activeJobs: number;
  paidSubscriptions: number;
  estimatedMRR: number;
  totalApplications?: number;
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
    <div className="relative space-y-5">
      <div className="dash-page-header">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl dark:text-white">
          Welcome back, {user.firstName}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
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
      <div className="dash-stat-grid">
        <DashboardStatCard icon={FileText} label="Applications submitted" numeric={d.applications} colorIndex={0} />
        <DashboardStatCard icon={Bell} label="Invitations received" numeric={d.invitations} sub="This month" colorIndex={1} />
        <DashboardStatCard icon={Briefcase} label="Saved jobs" numeric={d.savedJobs} colorIndex={2} />
        <DashboardStatCard icon={Target} label="Avg. match score" numeric={avgMatch} suffix="%" colorIndex={3} />
        <DashboardStatCard icon={BarChart3} label="Profile completion" numeric={d.profileCompletion} suffix="%" colorIndex={4} />
        <DashboardStatCard icon={Bell} label="Unread notifications" numeric={d.unreadNotifications} colorIndex={5} />
        <DashboardStatCard icon={Clock} label="Active applications" numeric={d.activeApplications ?? 0} colorIndex={6} />
        <DashboardStatCard icon={CheckCircle2} label="Offers received" numeric={d.offersReceived ?? 0} colorIndex={7} />
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Card className="dash-panel">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base">Application pipeline</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {d.applications > 0 ? (
              <HorizontalBarChart items={pipelineToChartItemsAll(d.applicationPipeline ?? {})} />
            ) : (
              <p className="text-sm text-muted-foreground">No applications yet. Browse jobs to get started.</p>
            )}
          </CardContent>
        </Card>

        <Card className="dash-panel">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base">Top match scores</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {d.recommendedJobs?.length ? (
              <VerticalBarChart
                items={d.recommendedJobs.slice(0, 5).map((m, i) => ({
                  label: m.job.title.split(' ').slice(0, 2).join(' '),
                  value: m.matchScore,
                  color: ['#2563eb', '#059669', '#d97706', '#7c3aed', '#e11d48'][i],
                }))}
              />
            ) : (
              <p className="text-sm text-muted-foreground">Complete your profile to unlock match scores.</p>
            )}
          </CardContent>
        </Card>

        <Card className="dash-panel">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base">Career insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4 pt-0">
            <DonutChart
              centerLabel={`${d.profileCompletion}%`}
              centerSub="profile"
              segments={[
                { label: 'Complete', value: d.profileCompletion },
                { label: 'Remaining', value: Math.max(100 - d.profileCompletion, 0) },
              ]}
            />
            <div className="grid grid-cols-2 gap-2">
              <InsightTile
                label="Response rate"
                value={d.applications > 0 ? Math.round(((d.offersReceived ?? 0) / d.applications) * 100) : 0}
                suffix="%"
                hint="Offers vs applications"
              />
              <InsightTile
                label="Verification"
                value={titleCase(d.verificationStatus)}
                hint="License & credentials"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Card className="dash-panel lg:col-span-1">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base">Profile strength</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4 pt-0">
            <Progress value={d.profileCompletion} />
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Completion</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                <AnimatedCounter end={d.profileCompletion} suffix="%" />
              </span>
            </div>
            <Button variant="outline" className="w-full" asChild>
              <Link to="/profile">Complete your profile</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="dash-panel lg:col-span-2">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="flex items-center gap-2 text-base text-slate-900 dark:text-white">
              <Sparkles className="h-4 w-4 text-blue-600" /> Top job matches
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 p-4 pt-0">
            {d.recommendedJobs?.length ? (
              d.recommendedJobs.map((m) => (
                <Link
                  key={m.job.id}
                  to={`/jobs/${m.job.id}`}
                  className="flex items-center justify-between rounded-lg bg-slate-50 p-3 transition-colors hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800/70"
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

const PIPELINE_STAGES = ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected'] as const;

function pipelineToChartItemsAll(pipeline: Record<string, number>) {
  return PIPELINE_STAGES.map((stage) => ({
    label: stage,
    value: pipeline[stage] ?? 0,
    color: PIPELINE_STAGE_COLORS[stage],
  }));
}

function OrganizationDashboard({ d }: { d: OrgDash }) {
  const pipelineTotal = PIPELINE_STAGES.reduce((s, stage) => s + (d.pipeline?.[stage] ?? 0), 0);
  const hired = d.pipeline?.hired ?? 0;
  const hireRate = pipelineTotal > 0 ? Math.round((hired / pipelineTotal) * 100) : 0;

  return (
    <>
      <div className="dash-stat-grid">
        <DashboardStatCard icon={Briefcase} label="Open job postings" numeric={d.totalJobs} colorIndex={0} />
        <DashboardStatCard icon={FileText} label="Total applications" numeric={d.applications} colorIndex={1} />
        <DashboardStatCard icon={Users} label="Candidate matches" numeric={d.candidateMatches} colorIndex={2} />
        <DashboardStatCard icon={Eye} label="Facility profile views" numeric={d.profileViews} colorIndex={3} />
        <DashboardStatCard icon={TrendingUp} label="Hire conversion rate" numeric={hireRate} suffix="%" colorIndex={4} />
        <DashboardStatCard icon={Clock} label="Candidates in pipeline" numeric={pipelineTotal} colorIndex={5} />
        <DashboardStatCard icon={Briefcase} label="Jobs posted" numeric={d.totalJobsPosted ?? d.totalJobs} colorIndex={6} />
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Card className="dash-panel lg:col-span-2">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base">Recruitment funnel</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <HorizontalBarChart items={pipelineToChartItemsAll(d.pipeline ?? {})} />
          </CardContent>
        </Card>

        <Card className="dash-panel">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base">Hiring outcomes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4 pt-0">
            <DonutChart
              centerLabel={`${hireRate}%`}
              centerSub="hired"
              segments={[
                { label: 'Hired', value: hired, color: '#059669' },
                { label: 'In progress', value: Math.max(pipelineTotal - hired - (d.pipeline?.rejected ?? 0), 0), color: '#2563eb' },
                { label: 'Rejected', value: d.pipeline?.rejected ?? 0, color: '#e11d48' },
              ]}
            />
            <div className="grid grid-cols-2 gap-2">
              <InsightTile label="Open roles" value={d.totalJobs} hint="Currently accepting" />
              <InsightTile label="Closed roles" value={d.closedJobs ?? 0} hint="Filled or expired" />
              <InsightTile label="Profile views" value={d.profileViews} hint="Job listing reach" />
              <InsightTile label="Verification" value={titleCase(d.verificationStatus)} hint="Facility status" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="dash-panel">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-base">Pipeline breakdown</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <PipelineBreakdownChart pipeline={d.pipeline ?? {}} stages={PIPELINE_STAGES} />
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
      <div className="dash-stat-grid">
        <DashboardStatCard icon={Users} label="Total platform users" numeric={d.totalUsers} colorIndex={0} />
        <DashboardStatCard icon={Users} label="Healthcare organizations" numeric={d.totalOrganizations} colorIndex={1} />
        <DashboardStatCard icon={CheckCircle2} label="Verified professionals" numeric={d.verifiedProfessionals} colorIndex={2} />
        <DashboardStatCard icon={Briefcase} label="Active job listings" numeric={d.activeJobs} colorIndex={3} />
        <DashboardStatCard icon={TrendingUp} label="Paid subscriptions" numeric={d.paidSubscriptions} colorIndex={4} />
        <DashboardStatCard
          icon={TrendingUp}
          label="Estimated MRR"
          numeric={d.estimatedMRR}
          prefix="$"
          colorIndex={5}
        />
        <DashboardStatCard icon={FileText} label="Total applications" numeric={d.totalApplications ?? 0} colorIndex={6} />
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Card className="dash-panel">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base">Platform scale</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <VerticalBarChart
              items={[
                { label: 'Users', value: d.totalUsers, color: '#2563eb' },
                { label: 'Pros', value: d.totalProfessionals, color: '#059669' },
                { label: 'Orgs', value: d.totalOrganizations, color: '#d97706' },
                { label: 'Jobs', value: d.activeJobs, color: '#7c3aed' },
                { label: 'Apps', value: d.totalApplications ?? 0, color: '#0891b2' },
              ]}
            />
          </CardContent>
        </Card>

        <Card className="dash-panel">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base">User breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4 pt-0">
            <HorizontalBarChart
              items={[
                { label: 'Professionals', value: d.totalProfessionals, color: '#2563eb' },
                { label: 'Organizations', value: d.totalOrganizations, color: '#059669' },
                { label: 'Verified pros', value: d.verifiedProfessionals, color: '#7c3aed' },
                { label: 'Paid subs', value: d.paidSubscriptions, color: '#d97706' },
              ]}
            />
          </CardContent>
        </Card>

        <Card className="dash-panel">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base">Verification health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4 pt-0">
            <DonutChart
              centerLabel={`${verificationRate}%`}
              centerSub="verified"
              segments={[
                { label: 'Verified', value: d.verifiedProfessionals, color: '#059669' },
                { label: 'Unverified', value: d.unverifiedProfessionals ?? Math.max(d.totalProfessionals - d.verifiedProfessionals, 0), color: '#94a3b8' },
              ]}
            />
            <div className="grid grid-cols-2 gap-2">
              <InsightTile label="Active jobs" value={d.activeJobs} hint="Open listings" />
              <InsightTile label="Applications" value={d.totalApplications ?? 0} hint="Platform-wide" />
              <InsightTile label="Paid subs" value={d.paidSubscriptions} hint="Revenue base" />
              <InsightTile
                label="Jobs per org"
                value={d.totalOrganizations > 0 ? Math.round(d.activeJobs / d.totalOrganizations) : 0}
                hint="Avg. listing density"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="dash-panel">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-base">Revenue snapshot</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <RevenueSnapshotChart
            estimatedMRR={d.estimatedMRR}
            paidSubscriptions={d.paidSubscriptions}
            activeJobs={d.activeJobs}
            totalUsers={d.totalUsers}
          />
        </CardContent>
      </Card>

      <Button asChild>
        <Link to="/admin">Open admin panel</Link>
      </Button>
    </>
  );
}
