import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Check, X, Users, Briefcase, ShieldCheck, FileWarning } from 'lucide-react';
import { api, ApiEnvelope, apiError } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageLoader } from '@/components/ui/misc';
import { AnimatedCounter } from '@/components/AnimatedCounter';

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
    <div className="flex items-center justify-between rounded-xl border border-primary/10 p-3">
      <div>
        <p className="text-sm font-medium">{title}</p>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="flex gap-2">
        <Button size="icon" variant="outline" onClick={() => act.mutate({ kind, id, approve: true })}>
          <Check className="h-4 w-4 text-primary" />
        </Button>
        <Button size="icon" variant="outline" onClick={() => act.mutate({ kind, id, approve: false })}>
          <X className="h-4 w-4 text-primary/60" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Admin panel</h1>
        <p className="text-muted-foreground">Platform metrics and pending verifications.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Users, label: 'Total users', value: stats?.totalUsers ?? 0 },
          { icon: ShieldCheck, label: 'Verified professionals', value: stats?.verifiedProfessionals ?? 0 },
          { icon: Briefcase, label: 'Active jobs', value: stats?.activeJobs ?? 0 },
          { icon: FileWarning, label: 'Pending reviews', value: pendingTotal },
        ].map((s) => (
          <Card key={s.label} className="border-primary/10">
            <CardContent className="p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <s.icon className="h-5 w-5" />
              </div>
              <p className="mt-3 text-3xl font-bold text-primary">
                <AnimatedCounter end={s.value} />
              </p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-primary/10">
          <CardContent className="p-5 text-center">
            <p className="text-2xl font-bold text-primary">
              <AnimatedCounter end={stats?.totalProfessionals ?? 0} />
            </p>
            <p className="text-sm text-muted-foreground">Professionals</p>
          </CardContent>
        </Card>
        <Card className="border-primary/10">
          <CardContent className="p-5 text-center">
            <p className="text-2xl font-bold text-primary">
              <AnimatedCounter end={stats?.totalOrganizations ?? 0} />
            </p>
            <p className="text-sm text-muted-foreground">Organizations</p>
          </CardContent>
        </Card>
        <Card className="border-primary/10">
          <CardContent className="p-5 text-center">
            <p className="text-2xl font-bold text-primary">
              $<AnimatedCounter end={stats?.estimatedMRR ?? 0} />
            </p>
            <p className="text-sm text-muted-foreground">Estimated MRR</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-primary/10">
          <CardHeader>
            <CardTitle>
              Professionals (
              <AnimatedCounter end={data?.professionals.length ?? 0} />
              )
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
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
              <p className="text-sm text-muted-foreground">Nothing pending.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-primary/10">
          <CardHeader>
            <CardTitle>
              Organizations (
              <AnimatedCounter end={data?.organizations.length ?? 0} />
              )
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data?.organizations.length ? (
              data.organizations.map((o) => (
                <Row key={o.id} kind="organizations" id={o.id} title={o.organization_name} subtitle={o.email} />
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Nothing pending.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-primary/10">
          <CardHeader>
            <CardTitle>
              Licenses (
              <AnimatedCounter end={data?.licenses.length ?? 0} />
              )
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
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
              <p className="text-sm text-muted-foreground">Nothing pending.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
