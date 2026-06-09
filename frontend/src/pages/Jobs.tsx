import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Briefcase, Building2, Calendar, MapPin, Plus, Search, Trash2 } from 'lucide-react';
import { api, ApiEnvelope, apiError } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Label, Select, Textarea } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { EmptyState, PageLoader, Spinner } from '@/components/ui/misc';
import { formatCurrency, timeAgo, titleCase } from '@/lib/utils';

interface Job {
  id: string;
  title: string;
  description?: string;
  profession?: string;
  city?: string;
  country?: string;
  employment_type?: string;
  salary_min?: number;
  salary_max?: number;
  currency?: string;
  status?: string;
  expires_at?: string | null;
  organization_name?: string;
  organization_type?: string | null;
  created_at: string;
}

const professions = ['nurse', 'doctor', 'pharmacist', 'lab_technician', 'radiographer', 'midwife', 'physiotherapist', 'caregiver'];

function formatDeadline(date?: string | null) {
  if (!date) return null;
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function isDeadlinePassed(date?: string | null) {
  return !!date && new Date(date) < new Date();
}

export default function Jobs() {
  const user = useAuthStore((s) => s.user)!;
  const isOrg = user.role === 'organization';
  const [q, setQ] = useState('');
  const [profession, setProfession] = useState('');
  const [showForm, setShowForm] = useState(false);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['jobs', q, profession, user.role],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (profession) params.set('profession', profession);
      const res = await api.get<ApiEnvelope<Job[]>>(`/jobs?${params.toString()}`);
      return res.data;
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/jobs/${id}`)).data,
    onSuccess: () => {
      toast.success('Job deleted');
      qc.invalidateQueries({ queryKey: ['jobs'] });
    },
    onError: (e) => toast.error(apiError(e)),
  });

  const jobs = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Jobs</h1>
          <p className="text-muted-foreground">
            {isOrg ? 'View and manage your posted opportunities.' : 'Discover roles from healthcare facilities nationwide.'}
          </p>
        </div>
        {isOrg && (
          <Button onClick={() => setShowForm((s) => !s)}>
            <Plus className="h-4 w-4" /> Post a job
          </Button>
        )}
      </div>

      {isOrg && showForm && <JobForm onDone={() => setShowForm(false)} />}

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder={isOrg ? 'Search your jobs...' : 'Search jobs...'}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <Select value={profession} onChange={(e) => setProfession(e.target.value)} className="w-48">
          <option value="">All professions</option>
          {professions.map((p) => (
            <option key={p} value={p}>
              {titleCase(p)}
            </option>
          ))}
        </Select>
      </div>

      {isLoading ? (
        <PageLoader />
      ) : jobs.length ? (
        <div className="grid gap-4">
          {jobs.map((job) =>
            isOrg ? (
              <OrgJobCard
                key={job.id}
                job={job}
                onDelete={() => {
                  if (window.confirm(`Delete "${job.title}"? This cannot be undone.`)) {
                    remove.mutate(job.id);
                  }
                }}
                deleting={remove.isPending}
              />
            ) : (
              <ProfessionalJobCard key={job.id} job={job} />
            ),
          )}
        </div>
      ) : (
        <EmptyState
          icon={<Briefcase className="h-10 w-10" />}
          title={isOrg ? 'No jobs posted yet' : 'No jobs found'}
          description={isOrg ? 'Post your first opportunity to start receiving applications.' : 'Try adjusting your filters.'}
        />
      )}
    </div>
  );
}

function ProfessionalJobCard({ job }: { job: Job }) {
  return (
    <Link to={`/jobs/${job.id}`}>
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="flex flex-wrap items-start justify-between gap-4 p-5">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">{job.title}</h3>
            {job.organization_name && (
              <p className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                <Building2 className="h-4 w-4" />
                {job.organization_name}
                {job.organization_type && (
                  <span className="font-normal text-muted-foreground">· {titleCase(job.organization_type)}</span>
                )}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
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
              <span>{timeAgo(job.created_at)}</span>
              {job.expires_at && (
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Closes {formatDeadline(job.expires_at)}
                </span>
              )}
            </div>
            {job.description && (
              <p className="line-clamp-2 max-w-2xl text-sm text-muted-foreground">{job.description}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            {job.employment_type && <Badge variant="outline">{titleCase(job.employment_type)}</Badge>}
            <span className="text-sm font-medium">
              {formatCurrency(job.salary_min, job.currency)} – {formatCurrency(job.salary_max, job.currency)}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function OrgJobCard({
  job,
  onDelete,
  deleting,
}: {
  job: Job;
  onDelete: () => void;
  deleting: boolean;
}) {
  const closed = job.status !== 'open' || isDeadlinePassed(job.expires_at);

  return (
    <Card>
      <CardContent className="flex flex-wrap items-start justify-between gap-4 p-5">
        <div className="min-w-0 flex-1 space-y-2">
          <Link to={`/jobs/${job.id}`} className="text-lg font-semibold hover:text-primary hover:underline">
            {job.title}
          </Link>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
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
            <span>Posted {timeAgo(job.created_at)}</span>
            {job.expires_at && (
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Closes {formatDeadline(job.expires_at)}
              </span>
            )}
          </div>
          {job.description && (
            <p className="line-clamp-2 max-w-2xl text-sm text-muted-foreground">{job.description}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          {closed ? <Badge variant="secondary">Closed</Badge> : <Badge variant="outline">Open</Badge>}
          {job.employment_type && <Badge variant="outline">{titleCase(job.employment_type)}</Badge>}
          <span className="text-sm font-medium">
            {formatCurrency(job.salary_min, job.currency)} – {formatCurrency(job.salary_max, job.currency)}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            disabled={deleting}
            onClick={onDelete}
          >
            <Trash2 className="mr-1 h-4 w-4" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function JobForm({ onDone }: { onDone: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    title: '',
    description: '',
    profession: 'nurse',
    specialization: '',
    city: '',
    country: '',
    employment_type: 'full_time',
    salary_min: '',
    salary_max: '',
    experience_min: '',
    expires_at: '',
  });

  const create = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        salary_min: form.salary_min ? Number(form.salary_min) : undefined,
        salary_max: form.salary_max ? Number(form.salary_max) : undefined,
        experience_min: form.experience_min ? Number(form.experience_min) : undefined,
        expires_at: form.expires_at || undefined,
      };
      return (await api.post('/jobs', payload)).data;
    },
    onSuccess: () => {
      toast.success('Job posted');
      qc.invalidateQueries({ queryKey: ['jobs'] });
      onDone();
    },
    onError: (e) => toast.error(apiError(e)),
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Card>
      <CardContent className="p-5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate();
          }}
          className="grid gap-4 sm:grid-cols-2"
        >
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Job title</Label>
            <Input value={form.title} onChange={(e) => set('title', e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label>Profession</Label>
            <Select value={form.profession} onChange={(e) => set('profession', e.target.value)}>
              {professions.map((p) => (
                <option key={p} value={p}>
                  {titleCase(p)}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Specialization</Label>
            <Input value={form.specialization} onChange={(e) => set('specialization', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>City</Label>
            <Input value={form.city} onChange={(e) => set('city', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Country</Label>
            <Input value={form.country} onChange={(e) => set('country', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Salary min</Label>
            <Input type="number" value={form.salary_min} onChange={(e) => set('salary_min', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Salary max</Label>
            <Input type="number" value={form.salary_max} onChange={(e) => set('salary_max', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Application closing date</Label>
            <Input
              type="date"
              value={form.expires_at}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => set('expires_at', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Optional. Applications close at end of this date.</p>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => set('description', e.target.value)} />
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" disabled={create.isPending}>
              {create.isPending && <Spinner />} Publish job
            </Button>
            <Button type="button" variant="ghost" onClick={onDone}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
