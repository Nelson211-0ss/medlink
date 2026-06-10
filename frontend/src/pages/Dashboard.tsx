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
} from 'lucide-react';
import { api, ApiEnvelope } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageLoader } from '@/components/ui/misc';
import { Button } from '@/components/ui/button';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { DashboardStatCard } from '@/components/DashboardStatCard';
import { RevenueSnapshotChart } from '@/components/RevenueSnapshotChart';
import {
  DASHBOARD_COLOR_LIST,
  DASHBOARD_COLORS,
  DonutChart,
  HorizontalBarChart,
  InsightTile,
  PIPELINE_STAGE_COLORS,
  PipelineBreakdownChart,
  VerticalBarChart,
} from '@/components/dashboard/Charts';
import { JobApplyButton } from '@/components/JobApplyButton';
import { titleCase } from '@/lib/utils';

interface ProDash {
  verificationStatus: string;
  applications: number;
  applicationPipeline?: Record<string, number>;
  activeApplications?: number;
  offersReceived?: number;
  recommendedJobs: { job: { id: string; title: string; city?: string }; matchScore: number; reasons: string[] }[];
  savedJobs: number;
  invitations: number;
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

  const isAdmin = user.role === 'admin';

  return (
    <div className={isAdmin ? 'admin-dashboard-page' : 'relative space-y-5'}>
      <div className={isAdmin ? 'admin-dashboard-header' : 'dash-page-header'}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className={isAdmin ? 'admin-dashboard-title' : 'text-xl font-bold tracking-tight text-slate-900 sm:text-2xl dark:text-white'}>
              Welcome back, {user.firstName}
            </h1>
            <p className={isAdmin ? 'admin-dashboard-subtitle' : 'mt-1 text-sm text-slate-500 dark:text-slate-400'}>
              {user.role === 'professional' && 'Track applications, matches, and invitations.'}
              {user.role === 'organization' && 'Monitor hiring pipeline, applicants, and facility reach.'}
              {user.role === 'admin' && 'Platform overview — users, jobs, revenue and verification.'}
            </p>
          </div>
          {isAdmin && (
            <Button variant="outline" size="sm" className="shrink-0" asChild>
              <Link to="/admin">Admin panel</Link>
            </Button>
          )}
        </div>
      </div>

      {user.role === 'professional' && <ProfessionalDashboard d={data as ProDash} />}
      {user.role === 'organization' && <OrganizationDashboard d={data as OrgDash} />}
      {user.role === 'admin' && <AdminDashboard d={data as AdminStats} />}
    </div>
  );
}

interface MyApplication {
  job_id: string;
}

function ProfessionalDashboard({ d }: { d: ProDash }) {
  const { data: myApplications } = useQuery({
    queryKey: ['applications', 'me'],
    queryFn: async () =>
      (await api.get<ApiEnvelope<MyApplication[]>>('/applications/me')).data.data,
  });

  const appliedJobIds = new Set(myApplications?.map((a) => a.job_id) ?? []);

  const topMatches = uniqueRecommendedJobs(d.recommendedJobs ?? []);
  const avgMatch = topMatches.length
    ? Math.round(topMatches.reduce((s, j) => s + j.matchScore, 0) / topMatches.length)
    : 0;

  return (
    <>
      <div className="dash-stat-grid">
        <DashboardStatCard icon={FileText} label="Applications submitted" numeric={d.applications} colorIndex={0} />
        <DashboardStatCard icon={Bell} label="Invitations received" numeric={d.invitations} sub="This month" colorIndex={1} />
        <DashboardStatCard icon={Briefcase} label="Saved jobs" numeric={d.savedJobs} colorIndex={2} />
        <DashboardStatCard icon={Target} label="Avg. match score" numeric={avgMatch} suffix="%" colorIndex={3} />
        <DashboardStatCard icon={Clock} label="Active applications" numeric={d.activeApplications ?? 0} colorIndex={4} />
        <DashboardStatCard icon={CheckCircle2} label="Offers received" numeric={d.offersReceived ?? 0} colorIndex={5} />
      </div>

      <div className="grid gap-3 lg:grid-cols-3 lg:items-stretch">
        <Card className="dash-panel flex flex-col">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base">Application pipeline</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col justify-center p-4 pt-0">
            {d.applications > 0 ? (
              <HorizontalBarChart items={pipelineToChartItemsAll(d.applicationPipeline ?? {})} />
            ) : (
              <p className="text-sm text-muted-foreground">No applications yet. Browse jobs to get started.</p>
            )}
          </CardContent>
        </Card>

        <Card className="dash-panel flex flex-col">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base">Top match scores</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col justify-center p-4 pt-0">
            {topMatches.length ? (
              <DonutChart
                valueSuffix="%"
                labelMax={24}
                centerLabel={`${avgMatch}%`}
                centerSub="avg match"
                segments={topMatches.map((m, i) => ({
                  label: m.job.title,
                  value: m.matchScore,
                  color: DASHBOARD_COLOR_LIST[i % DASHBOARD_COLOR_LIST.length],
                }))}
              />
            ) : (
              <p className="text-sm text-muted-foreground">Complete your profile to unlock match scores.</p>
            )}
          </CardContent>
        </Card>

        <Card className="dash-panel flex flex-col">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base">Career insights</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col justify-center p-4 pt-0">
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
              <InsightTile label="Saved jobs" value={d.savedJobs} hint="Bookmarked roles" />
              <InsightTile label="Invitations" value={d.invitations} hint="Received this month" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="dash-panel">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="flex items-center gap-2 text-base text-slate-900 dark:text-white">
            <Sparkles className="h-4 w-4 text-blue-600" /> Top job matches
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 p-4 pt-0">
          {topMatches.length ? (
            topMatches.map((m) => (
              <div
                key={m.job.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-50 p-3 dark:bg-slate-800/40"
              >
                <div className="min-w-0 flex-1">
                  <Link to={`/jobs/${m.job.id}`} className="font-medium hover:text-primary hover:underline">
                    {m.job.title}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {[m.job.city, m.reasons?.slice(0, 2).join(' · ')].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant="default">
                    <AnimatedCounter end={m.matchScore} suffix="%" />
                  </Badge>
                  <JobApplyButton jobId={m.job.id} applied={appliedJobIds.has(m.job.id)} />
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Complete your profile to get matched.</p>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function uniqueRecommendedJobs(
  jobs: ProDash['recommendedJobs'],
): ProDash['recommendedJobs'] {
  const byId = new Map<string, ProDash['recommendedJobs'][number]>();
  for (const m of jobs) {
    const existing = byId.get(m.job.id);
    if (!existing || m.matchScore > existing.matchScore) {
      byId.set(m.job.id, m);
    }
  }
  return [...byId.values()].sort((a, b) => b.matchScore - a.matchScore).slice(0, 5);
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
                { label: 'Hired', value: hired, color: DASHBOARD_COLORS.red },
                { label: 'In progress', value: Math.max(pipelineTotal - hired - (d.pipeline?.rejected ?? 0), 0), color: DASHBOARD_COLORS.blue },
                { label: 'Rejected', value: d.pipeline?.rejected ?? 0, color: DASHBOARD_COLORS.red },
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

function AdminDashPanel({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={className ?? 'admin-dash-panel'}>
      <CardHeader className="admin-dash-panel-header">
        <CardTitle className="admin-dash-panel-title">{title}</CardTitle>
      </CardHeader>
      <CardContent className="admin-dash-panel-body">{children}</CardContent>
    </Card>
  );
}

function AdminDashboard({ d }: { d: AdminStats }) {
  const verificationRate =
    d.totalProfessionals > 0 ? Math.round((d.verifiedProfessionals / d.totalProfessionals) * 100) : 0;

  return (
    <div className="admin-dashboard">
      <div className="admin-dash-stats">
        <DashboardStatCard icon={Users} label="Total users" numeric={d.totalUsers} colorIndex={0} className="admin-dash-stat" />
        <DashboardStatCard icon={Users} label="Organizations" numeric={d.totalOrganizations} colorIndex={1} className="admin-dash-stat" />
        <DashboardStatCard icon={CheckCircle2} label="Verified pros" numeric={d.verifiedProfessionals} colorIndex={2} className="admin-dash-stat" />
        <DashboardStatCard icon={Briefcase} label="Active jobs" numeric={d.activeJobs} colorIndex={3} className="admin-dash-stat" />
        <DashboardStatCard icon={TrendingUp} label="Paid subs" numeric={d.paidSubscriptions} colorIndex={4} className="admin-dash-stat" />
        <DashboardStatCard icon={TrendingUp} label="Est. MRR" numeric={d.estimatedMRR} prefix="$" colorIndex={5} className="admin-dash-stat" />
        <DashboardStatCard icon={FileText} label="Applications" numeric={d.totalApplications ?? 0} colorIndex={6} className="admin-dash-stat" />
      </div>

      <div className="admin-dash-grid">
        <AdminDashPanel title="Platform scale">
          <VerticalBarChart
            compact
            height={72}
            items={[
              { label: 'Users', value: d.totalUsers, color: DASHBOARD_COLORS.blue },
              { label: 'Pros', value: d.totalProfessionals, color: DASHBOARD_COLORS.red },
              { label: 'Orgs', value: d.totalOrganizations, color: DASHBOARD_COLORS.orange },
              { label: 'Jobs', value: d.activeJobs, color: DASHBOARD_COLORS.red },
              { label: 'Apps', value: d.totalApplications ?? 0, color: DASHBOARD_COLORS.blue },
            ]}
          />
        </AdminDashPanel>

        <AdminDashPanel title="User breakdown">
          <HorizontalBarChart
            compact
            items={[
              { label: 'Professionals', value: d.totalProfessionals, color: DASHBOARD_COLORS.blue },
              { label: 'Organizations', value: d.totalOrganizations, color: DASHBOARD_COLORS.red },
              { label: 'Verified pros', value: d.verifiedProfessionals, color: DASHBOARD_COLORS.orange },
              { label: 'Paid subs', value: d.paidSubscriptions, color: DASHBOARD_COLORS.red },
            ]}
          />
        </AdminDashPanel>

        <AdminDashPanel title="Verification health">
          <DonutChart
            compact
            showLegend={false}
            centerLabel={`${verificationRate}%`}
            centerSub="verified"
            segments={[
              { label: 'Verified', value: d.verifiedProfessionals, color: DASHBOARD_COLORS.red },
              {
                label: 'Unverified',
                value: d.unverifiedProfessionals ?? Math.max(d.totalProfessionals - d.verifiedProfessionals, 0),
                color: DASHBOARD_COLORS.orange,
              },
            ]}
          />
          <div className="admin-dash-mini-stats">
            <InsightTile label="Active jobs" value={d.activeJobs} hint="Open listings" />
            <InsightTile label="Applications" value={d.totalApplications ?? 0} hint="Platform-wide" />
          </div>
        </AdminDashPanel>

        <AdminDashPanel title="Revenue snapshot" className="admin-dash-panel admin-dash-panel--revenue">
          <RevenueSnapshotChart
            compact
            estimatedMRR={d.estimatedMRR}
            paidSubscriptions={d.paidSubscriptions}
            activeJobs={d.activeJobs}
            totalUsers={d.totalUsers}
          />
        </AdminDashPanel>
      </div>
    </div>
  );
}
