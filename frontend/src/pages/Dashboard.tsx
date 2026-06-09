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
} from 'lucide-react';
import { api, ApiEnvelope } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress, PageLoader } from '@/components/ui/misc';
import { Button } from '@/components/ui/button';
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

function StatCard({ icon: Icon, label, value, accent }: { icon: React.ElementType; label: string; value: React.ReactNode; accent?: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${accent ?? 'bg-primary/10 text-primary'}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Here&apos;s what&apos;s happening on your account.</p>
      </div>

      {user.role === 'professional' && <ProfessionalDashboard d={data as ProDash} />}
      {user.role === 'organization' && <OrganizationDashboard d={data as OrgDash} />}
      {user.role === 'admin' && <AdminDashboard d={data as AdminStats} />}
    </div>
  );
}

function ProfessionalDashboard({ d }: { d: ProDash }) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={FileText} label="Applications" value={d.applications} />
        <StatCard icon={Bell} label="Invitations" value={d.invitations} accent="bg-secondary/10 text-secondary" />
        <StatCard icon={Briefcase} label="Saved jobs" value={d.savedJobs} />
        <StatCard icon={Bell} label="Notifications" value={d.unreadNotifications} accent="bg-amber-100 text-amber-700" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Profile completion
              <Badge variant={d.verificationStatus === 'verified' ? 'success' : 'warning'}>
                {titleCase(d.verificationStatus)}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Progress value={d.profileCompletion} />
            <p className="text-sm text-muted-foreground">{d.profileCompletion}% complete</p>
            <Button variant="outline" className="w-full" asChild>
              <Link to="/profile">Complete your profile</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-secondary" /> Recommended jobs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {d.recommendedJobs?.length ? (
              d.recommendedJobs.map((m) => (
                <Link
                  key={m.job.id}
                  to={`/jobs/${m.job.id}`}
                  className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent"
                >
                  <div>
                    <p className="font-medium">{m.job.title}</p>
                    <p className="text-sm text-muted-foreground">{m.reasons?.slice(0, 2).join(' · ')}</p>
                  </div>
                  <Badge variant="success">{m.matchScore}% match</Badge>
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
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Briefcase} label="Open jobs" value={d.totalJobs} />
        <StatCard icon={FileText} label="Applications" value={d.applications} accent="bg-secondary/10 text-secondary" />
        <StatCard icon={Users} label="Candidate matches" value={d.candidateMatches} />
        <StatCard icon={Eye} label="Profile views" value={d.profileViews} accent="bg-amber-100 text-amber-700" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recruitment pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {PIPELINE_STAGES.map((stage) => (
              <div key={stage} className="rounded-lg border p-4 text-center">
                <p className="text-2xl font-bold text-primary">{d.pipeline?.[stage] ?? 0}</p>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{stage}</p>
              </div>
            ))}
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
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Total users" value={d.totalUsers} />
        <StatCard icon={Users} label="Organizations" value={d.totalOrganizations} accent="bg-secondary/10 text-secondary" />
        <StatCard icon={CheckCircle2} label="Verified pros" value={d.verifiedProfessionals} />
        <StatCard icon={Briefcase} label="Active jobs" value={d.activeJobs} accent="bg-amber-100 text-amber-700" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard icon={TrendingUp} label="Paid subscriptions" value={d.paidSubscriptions} />
        <StatCard icon={TrendingUp} label="Estimated MRR" value={`$${d.estimatedMRR}`} accent="bg-secondary/10 text-secondary" />
        <StatCard icon={Users} label="Professionals" value={d.totalProfessionals} />
      </div>
      <Button asChild>
        <Link to="/admin">Open admin panel</Link>
      </Button>
    </>
  );
}
