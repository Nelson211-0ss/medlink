import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { api, ApiEnvelope } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState, PageLoader } from '@/components/ui/misc';
import { timeAgo, titleCase } from '@/lib/utils';

interface AppRow {
  id: string;
  job_id: string;
  job_title: string;
  organization_name: string;
  stage: string;
  match_score?: number;
  created_at: string;
}

const stageVariant = (stage: string) =>
  stage === 'hired' ? 'success' : stage === 'rejected' ? 'destructive' : stage === 'offer' ? 'secondary' : 'default';

export default function Applications() {
  const user = useAuthStore((s) => s.user)!;
  return user.role === 'organization' ? <OrgPipeline /> : <MyApplications />;
}

function MyApplications() {
  const { data, isLoading } = useQuery({
    queryKey: ['applications', 'me'],
    queryFn: async () => (await api.get<ApiEnvelope<AppRow[]>>('/applications/me')).data.data,
  });

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">My applications</h1>
      {data?.length ? (
        <div className="grid gap-3">
          {data.map((a) => (
            <Card key={a.id}>
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <Link to={`/jobs/${a.job_id}`} className="font-semibold hover:underline">
                    {a.job_title}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {a.organization_name} · applied {timeAgo(a.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {a.match_score != null && <Badge variant="secondary">{a.match_score}% match</Badge>}
                  <Badge variant={stageVariant(a.stage)}>{titleCase(a.stage)}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<FileText className="h-10 w-10" />}
          title="No applications yet"
          description="Browse jobs and apply to get started."
        />
      )}
    </div>
  );
}

const STAGES = ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected'];

function OrgPipeline() {
  const { data, isLoading } = useQuery({
    queryKey: ['pipeline'],
    queryFn: async () => (await api.get<ApiEnvelope<Record<string, number>>>('/applications/pipeline')).data.data,
  });

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Recruitment pipeline</h1>
      <Card>
        <CardHeader>
          <CardTitle>Candidates by stage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {STAGES.map((s) => (
              <div key={s} className="rounded-lg border p-4 text-center">
                <p className="text-3xl font-bold text-primary">{data?.[s] ?? 0}</p>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{s}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
