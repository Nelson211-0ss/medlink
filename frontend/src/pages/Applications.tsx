import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CheckCircle2, ExternalLink, FileText, User, XCircle } from 'lucide-react';
import { api, ApiEnvelope, apiError } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, EmptyState, PageLoader } from '@/components/ui/misc';
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

interface InboxRow {
  id: string;
  job_id: string;
  job_title: string;
  professional_id: string;
  first_name: string;
  last_name: string;
  avatar?: string | null;
  profession?: string | null;
  cover_letter?: string | null;
  stage: string;
  match_score?: number | null;
  created_at: string;
}

const stageVariant = (stage: string) =>
  stage === 'hired' ? 'success' : stage === 'rejected' ? 'destructive' : stage === 'offer' ? 'secondary' : 'default';

export default function Applications() {
  const user = useAuthStore((s) => s.user)!;
  return user.role === 'organization' ? <OrgApplications /> : <MyApplications />;
}

function MyApplications() {
  const { data, isLoading } = useQuery({
    queryKey: ['applications', 'me'],
    queryFn: async () => (await api.get<ApiEnvelope<AppRow[]>>('/applications/me')).data.data,
  });

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My applications</h1>
        <p className="mt-1 text-sm text-muted-foreground">Track the status of roles you have applied to.</p>
      </div>
      {data?.length ? (
        <div className="grid gap-3">
          {data.map((a) => (
            <Card key={a.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
                <div>
                  <Link to={`/jobs/${a.job_id}`} className="font-semibold hover:text-primary hover:underline">
                    {a.job_title}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {a.organization_name} · applied {timeAgo(a.created_at)}
                  </p>
                  {a.stage === 'hired' && (
                    <p className="mt-1 text-sm font-medium text-primary">You have been accepted for this role.</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {a.match_score != null && <Badge variant="outline">{a.match_score}% match</Badge>}
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

function OrgApplications() {
  const qc = useQueryClient();

  const { data: pipeline, isLoading: pipelineLoading } = useQuery({
    queryKey: ['pipeline'],
    queryFn: async () =>
      (await api.get<ApiEnvelope<Record<string, number>>>('/applications/pipeline')).data.data,
  });

  const { data: inbox, isLoading: inboxLoading } = useQuery({
    queryKey: ['applications-inbox'],
    queryFn: async () => (await api.get<ApiEnvelope<InboxRow[]>>('/applications/inbox')).data.data,
  });

  const updateStage = useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: string }) =>
      (await api.patch(`/applications/${id}/stage`, { stage })).data,
    onSuccess: (_, { stage }) => {
      toast.success(stage === 'hired' ? 'Candidate admitted — they have been notified' : 'Application updated');
      qc.invalidateQueries({ queryKey: ['applications-inbox'] });
      qc.invalidateQueries({ queryKey: ['pipeline'] });
      qc.invalidateQueries({ queryKey: ['job-applications'] });
    },
    onError: (e) => toast.error(apiError(e)),
  });

  if (pipelineLoading || inboxLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Applications</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review candidates who applied to your jobs, view their profiles, and admit the right fit.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pipeline overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {STAGES.map((s) => (
              <div key={s} className="rounded-lg border p-4 text-center">
                <p className="text-3xl font-bold text-primary">{pipeline?.[s] ?? 0}</p>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{s}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {inbox?.length ? (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Recent applicants</h2>
          {inbox.map((a) => {
            const name = `${a.first_name} ${a.last_name}`.trim();
            const terminal = a.stage === 'hired' || a.stage === 'rejected';
            return (
              <Card key={a.id}>
                <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <Avatar first={a.first_name} last={a.last_name} src={a.avatar} className="h-11 w-11" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{name}</p>
                        <Badge variant={stageVariant(a.stage)}>{titleCase(a.stage)}</Badge>
                        {a.match_score != null && (
                          <Badge variant="outline">{a.match_score}% match</Badge>
                        )}
                      </div>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        <Link to={`/jobs/${a.job_id}`} className="hover:text-primary hover:underline">
                          {a.job_title}
                        </Link>
                        {' · '}
                        {[a.profession && titleCase(a.profession), `Applied ${timeAgo(a.created_at)}`]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                      {a.cover_letter && (
                        <p className="mt-2 line-clamp-2 text-sm italic text-muted-foreground">
                          &ldquo;{a.cover_letter}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/candidates/${a.professional_id}`}>
                        <User className="h-4 w-4" />
                        Profile
                        <ExternalLink className="h-3 w-3 opacity-60" />
                      </Link>
                    </Button>
                    {!terminal && (
                      <>
                        <Button
                          size="sm"
                          disabled={updateStage.isPending}
                          onClick={() => updateStage.mutate({ id: a.id, stage: 'hired' })}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Admit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          disabled={updateStage.isPending}
                          onClick={() => updateStage.mutate({ id: a.id, stage: 'rejected' })}
                        >
                          <XCircle className="h-4 w-4" />
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<FileText className="h-10 w-10" />}
          title="No applications yet"
          description="When professionals apply to your job postings, they will appear here."
        />
      )}
    </div>
  );
}
