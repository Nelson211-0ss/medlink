import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Check, X, Users, Briefcase, ShieldCheck, FileWarning, TrendingUp, Building2 } from 'lucide-react';
import { api, ApiEnvelope, apiError } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageLoader } from '@/components/ui/misc';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { DashboardStatCard } from '@/components/DashboardStatCard';

interface Verifications {
  professionals: { id: string; first_name: string; last_name: string; profession?: string; email: string }[];
  organizations: { id: string; organization_name: string; registration_number?: string; email: string }[];
  licenses: { id: string; license_type: string; first_name: string; last_name: string }[];
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

export default function Admin() {
  const qc = useQueryClient();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => (await api.get<ApiEnvelope<AdminStats>>('/admin/stats')).data.data,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-verifications'],
    queryFn: async () => (await api.get<ApiEnvelope<Verifications>>('/admin/verifications')).data.data,
  });

  const act = useMutation({
    mutationFn: async ({ kind, id, approve }: { kind: string; id: string; approve: boolean }) =>
      (await api.post(`/admin/${kind}/${id}/verify`, { approve })).data,
    onSuccess: () => {
      toast.success('Updated');
      qc.invalidateQueries({ queryKey: ['admin-verifications'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
    },
    onError: (e) => toast.error(apiError(e)),
  });

  if (isLoading || statsLoading) return <PageLoader />;

  const pendingTotal =
    (data?.professionals.length ?? 0) + (data?.organizations.length ?? 0) + (data?.licenses.length ?? 0);

  const Row = ({ title, subtitle, kind, id }: { title: string; subtitle?: string; kind: string; id: string }) => (
    <div className="flex items-center justify-between rounded-lg bg-slate-50 p-2.5 dark:bg-slate-800/40">
      <div>
        <p className="text-sm font-medium text-slate-900 dark:text-white">{title}</p>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>
      <div className="flex gap-2">
        <Button size="icon" variant="outline" onClick={() => act.mutate({ kind, id, approve: true })}>
          <Check className="h-4 w-4 text-emerald-600" />
        </Button>
        <Button size="icon" variant="outline" onClick={() => act.mutate({ kind, id, approve: false })}>
          <X className="h-4 w-4 text-slate-400" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="dash-page-header">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl dark:text-white">Admin panel</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Platform metrics and pending verifications.</p>
      </div>

      <div className="dash-stat-grid">
        {[
          { icon: Users, label: 'Total users', value: stats?.totalUsers ?? 0 },
          { icon: ShieldCheck, label: 'Verified professionals', value: stats?.verifiedProfessionals ?? 0 },
          { icon: Briefcase, label: 'Active jobs', value: stats?.activeJobs ?? 0 },
          { icon: FileWarning, label: 'Pending reviews', value: pendingTotal },
          { icon: Users, label: 'Professionals', value: stats?.totalProfessionals ?? 0 },
          { icon: Building2, label: 'Organizations', value: stats?.totalOrganizations ?? 0 },
          { icon: TrendingUp, label: 'Estimated MRR', value: stats?.estimatedMRR ?? 0, prefix: '$' },
        ].map((s, i) => (
          <DashboardStatCard
            key={s.label}
            icon={s.icon}
            label={s.label}
            numeric={s.value}
            prefix={s.prefix}
            colorIndex={i}
          />
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Card className="dash-panel">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base">
              Professionals (
              <AnimatedCounter end={data?.professionals.length ?? 0} />
              )
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 p-4 pt-0">
            {data?.professionals.length ? (
              data.professionals.map((p) => (
                <Row
                  key={p.id}
                  kind="professionals"
                  id={p.id}
                  title={`${p.first_name} ${p.last_name}`}
                  subtitle={`${p.profession ?? ''} · ${p.email}`}
                />
              ))
            ) : (
              <p className="text-sm text-slate-500">Nothing pending.</p>
            )}
          </CardContent>
        </Card>

        <Card className="dash-panel">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base">
              Organizations (
              <AnimatedCounter end={data?.organizations.length ?? 0} />
              )
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 p-4 pt-0">
            {data?.organizations.length ? (
              data.organizations.map((o) => (
                <Row key={o.id} kind="organizations" id={o.id} title={o.organization_name} subtitle={o.email} />
              ))
            ) : (
              <p className="text-sm text-slate-500">Nothing pending.</p>
            )}
          </CardContent>
        </Card>

        <Card className="dash-panel">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base">
              Licenses (
              <AnimatedCounter end={data?.licenses.length ?? 0} />
              )
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 p-4 pt-0">
            {data?.licenses.length ? (
              data.licenses.map((l) => (
                <Row
                  key={l.id}
                  kind="licenses"
                  id={l.id}
                  title={l.license_type}
                  subtitle={`${l.first_name} ${l.last_name}`}
                />
              ))
            ) : (
              <p className="text-sm text-slate-500">Nothing pending.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
