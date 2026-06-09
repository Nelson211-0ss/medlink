import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Briefcase, Building2, Calendar, MapPin, Users } from 'lucide-react';
import { api, ApiEnvelope, apiError } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/input';
import { Avatar, PageLoader, Spinner } from '@/components/ui/misc';
import { formatCurrency, titleCase } from '@/lib/utils';

interface Job {
  id: string;
  title: string;
  description?: string;
  profession?: string;
  specialization?: string;
  skills?: string[];
  city?: string;
  country?: string;
  employment_type?: string;
  salary_min?: number;
  salary_max?: number;
  currency?: string;
  experience_min?: number;
  status?: string;
  expires_at?: string | null;
  organization_name?: string;
  organization_type?: string | null;
}

function formatDeadline(date?: string | null) {
  if (!date) return null;
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function applicationsClosed(job: Job) {
  return job.status !== 'open' || (!!job.expires_at && new Date(job.expires_at) < new Date());
}

export default function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((s) => s.user)!;
  const qc = useQueryClient();
  const [coverLetter, setCoverLetter] = useState('');

  const { data: job, isLoading } = useQuery({
    queryKey: ['job', id],
    queryFn: async () => (await api.get<ApiEnvelope<Job>>(`/jobs/${id}`)).data.data,
  });

  const apply = useMutation({
    mutationFn: async () => (await api.post(`/jobs/${id}/apply`, { coverLetter })).data,
    onSuccess: () => {
      toast.success('Application submitted!');
      qc.invalidateQueries({ queryKey: ['applications'] });
    },
    onError: (e) => toast.error(apiError(e)),
  });

  if (isLoading || !job) return <PageLoader />;

  const closed = applicationsClosed(job);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Card>
          <CardContent className="space-y-4 p-6">
            <h1 className="text-2xl font-bold">{job.title}</h1>
            {job.organization_name && user.role !== 'organization' && (
              <p className="inline-flex items-center gap-1.5 text-base font-medium text-primary">
                <Building2 className="h-5 w-5" />
                {job.organization_name}
                {job.organization_type && (
                  <span className="font-normal text-muted-foreground">· {titleCase(job.organization_type)}</span>
                )}
              </p>
            )}
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              {job.profession && (
                <span className="inline-flex items-center gap-1">
                  <Briefcase className="h-4 w-4" /> {titleCase(job.profession)}
                </span>
              )}
              {(job.city || job.country) && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-4 w-4" /> {[job.city, job.country].filter(Boolean).join(', ')}
                </span>
              )}
              {job.employment_type && <Badge variant="outline">{titleCase(job.employment_type)}</Badge>}
              {job.expires_at && (
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {closed ? 'Applications closed' : `Apply by ${formatDeadline(job.expires_at)}`}
                </span>
              )}
            </div>
            <div className="text-lg font-semibold">
              {formatCurrency(job.salary_min, job.currency)} – {formatCurrency(job.salary_max, job.currency)}
            </div>
            {job.skills && job.skills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {job.skills.map((s) => (
                  <Badge key={s} variant="secondary">
                    {s}
                  </Badge>
                ))}
              </div>
            )}
            <div className="prose prose-sm max-w-none whitespace-pre-wrap text-foreground">
              {job.description || 'No description provided.'}
            </div>
          </CardContent>
        </Card>

        {user.role === 'organization' && <CandidatesPanel jobId={job.id} />}
      </div>

      <div>
        {user.role === 'professional' && (
          <Card>
            <CardHeader>
              <CardTitle>Apply for this role</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {closed ? (
                <p className="text-sm text-muted-foreground">
                  This job is no longer accepting applications
                  {job.expires_at ? ` (closed ${formatDeadline(job.expires_at)})` : ''}.
                </p>
              ) : (
                <>
                  <Textarea
                    placeholder="Write a short cover letter..."
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    rows={6}
                  />
                  <Button className="w-full" onClick={() => apply.mutate()} disabled={apply.isPending}>
                    {apply.isPending && <Spinner />} Submit application
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

interface Candidate {
  professionalId: string;
  matchScore: number;
  reasons: string[];
}

function CandidatesPanel({ jobId }: { jobId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['candidates', jobId],
    queryFn: async () => (await api.get<ApiEnvelope<Candidate[]>>(`/jobs/${jobId}/candidates`)).data.data,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" /> Matched candidates
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <Spinner />
        ) : data?.length ? (
          data.map((c) => (
            <div key={c.professionalId} className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <Avatar />
                <div>
                  <p className="text-sm font-medium">Candidate {c.professionalId.slice(0, 6)}</p>
                  <p className="text-xs text-muted-foreground">{c.reasons.slice(0, 2).join(' · ')}</p>
                </div>
              </div>
              <Badge variant="success">{c.matchScore}%</Badge>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No matches yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
