import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CheckCircle2, ExternalLink, User, Users, XCircle } from 'lucide-react';
import { api, ApiEnvelope, apiError } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, Spinner } from '@/components/ui/misc';
import { timeAgo, titleCase } from '@/lib/utils';

export interface JobApplicant {
  id: string;
  professional_id: string;
  cover_letter?: string | null;
  stage: string;
  match_score?: number | null;
  created_at: string;
  first_name: string;
  last_name: string;
  avatar?: string | null;
  profession?: string | null;
}

const stageVariant = (stage: string) =>
  stage === 'hired'
    ? 'success'
    : stage === 'rejected'
      ? 'destructive'
      : stage === 'offer'
        ? 'secondary'
        : 'default';

function canAdmit(stage: string) {
  return stage !== 'hired' && stage !== 'rejected';
}

function canReject(stage: string) {
  return stage !== 'hired' && stage !== 'rejected';
}

export function JobApplicantsPanel({ jobId }: { jobId: string }) {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['job-applications', jobId],
    queryFn: async () =>
      (await api.get<ApiEnvelope<JobApplicant[]>>(`/jobs/${jobId}/applications`)).data.data,
  });

  const updateStage = useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: string }) =>
      (await api.patch(`/applications/${id}/stage`, { stage })).data,
    onSuccess: (_, { stage }) => {
      toast.success(stage === 'hired' ? 'Candidate admitted' : 'Application updated');
      qc.invalidateQueries({ queryKey: ['job-applications', jobId] });
      qc.invalidateQueries({ queryKey: ['applications-inbox'] });
      qc.invalidateQueries({ queryKey: ['pipeline'] });
    },
    onError: (e) => toast.error(apiError(e)),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Applicants
          {!!data?.length && (
            <Badge variant="secondary" className="ml-1 font-normal">
              {data.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <Spinner />
        ) : data?.length ? (
          data.map((a) => {
            const name = `${a.first_name} ${a.last_name}`.trim();
            return (
              <div
                key={a.id}
                className="flex flex-col gap-3 rounded-xl border border-border/60 bg-muted/20 p-4 sm:flex-row sm:items-center"
              >
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <Avatar first={a.first_name} last={a.last_name} src={a.avatar} className="h-11 w-11" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-foreground">{name}</p>
                      <Badge variant={stageVariant(a.stage)}>{titleCase(a.stage)}</Badge>
                      {a.match_score != null && (
                        <Badge variant="outline">{a.match_score}% match</Badge>
                      )}
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">
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

                <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col lg:flex-row">
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/candidates/${a.professional_id}`}>
                      <User className="h-4 w-4" />
                      View profile
                      <ExternalLink className="h-3 w-3 opacity-60" />
                    </Link>
                  </Button>
                  {canAdmit(a.stage) && (
                    <Button
                      size="sm"
                      disabled={updateStage.isPending}
                      onClick={() => updateStage.mutate({ id: a.id, stage: 'hired' })}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Admit
                    </Button>
                  )}
                  {canReject(a.stage) && (
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
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-muted-foreground">
            No applications yet. Professionals who apply will appear here with their full profile.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
