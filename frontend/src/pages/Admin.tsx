import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Check, X } from 'lucide-react';
import { api, ApiEnvelope, apiError } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageLoader } from '@/components/ui/misc';

interface Verifications {
  professionals: { id: string; first_name: string; last_name: string; profession?: string; email: string }[];
  organizations: { id: string; organization_name: string; registration_number?: string; email: string }[];
  licenses: { id: string; license_type: string; first_name: string; last_name: string }[];
}

export default function Admin() {
  const qc = useQueryClient();
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
    },
    onError: (e) => toast.error(apiError(e)),
  });

  if (isLoading) return <PageLoader />;

  const Row = ({ title, subtitle, kind, id }: { title: string; subtitle?: string; kind: string; id: string }) => (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div>
        <p className="text-sm font-medium">{title}</p>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="flex gap-2">
        <Button size="icon" variant="outline" onClick={() => act.mutate({ kind, id, approve: true })}>
          <Check className="h-4 w-4 text-emerald-600" />
        </Button>
        <Button size="icon" variant="outline" onClick={() => act.mutate({ kind, id, approve: false })}>
          <X className="h-4 w-4 text-red-600" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Admin panel</h1>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Professionals ({data?.professionals.length ?? 0})</CardTitle>
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

        <Card>
          <CardHeader>
            <CardTitle>Organizations ({data?.organizations.length ?? 0})</CardTitle>
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

        <Card>
          <CardHeader>
            <CardTitle>Licenses ({data?.licenses.length ?? 0})</CardTitle>
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
