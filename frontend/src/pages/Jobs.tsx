import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Briefcase,
  Calendar,
  DollarSign,
  FileText,
  MapPin,
  Plus,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { CountrySelect } from '@/components/CountrySelect';
import {
  OrgJobCard,
  ProfessionalJobCard,
  ProfessionalJobCardSkeleton,
  type JobListing,
} from '@/components/JobCard';
import { api, ApiEnvelope, apiError } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Input, Label, Select, Textarea } from '@/components/ui/input';
import { EmptyState, Spinner } from '@/components/ui/misc';
import { titleCase } from '@/lib/utils';

const professions = [
  'nurse',
  'doctor',
  'pharmacist',
  'lab_technician',
  'radiographer',
  'midwife',
  'physiotherapist',
  'caregiver',
] as const;

const employmentTypes = ['full_time', 'part_time', 'contract', 'locum', 'internship'] as const;

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
      const res = await api.get<ApiEnvelope<JobListing[]>>(`/jobs?${params.toString()}`);
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

  if (!isOrg) {
    return (
      <ProfessionalJobsBrowse
        jobs={jobs}
        isLoading={isLoading}
        q={q}
        setQ={setQ}
        profession={profession}
        setProfession={setProfession}
      />
    );
  }

  const total = jobs.length;
  const hasFilters = !!q || !!profession;
  const openCount = jobs.filter((j) => j.status === 'open').length;

  return (
    <div className="space-y-6">
      <section className="talent-hero">
        <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Job management
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Your job listings</h1>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
              Post openings, track applications, and reach qualified healthcare professionals across the country.
            </p>
          </div>
          <Button
            size="lg"
            className="shrink-0 rounded-xl shadow-sm"
            onClick={() => setShowForm((s) => !s)}
          >
            {showForm ? (
              <>
                <X className="h-4 w-4" /> Close form
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" /> Post a job
              </>
            )}
          </Button>
        </div>
      </section>

      {showForm && <JobForm onDone={() => setShowForm(false)} />}

      <section className="talent-search-bar space-y-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-11 rounded-xl border-border/60 bg-muted/40 pl-10 text-base shadow-none focus-visible:bg-background"
            placeholder="Search your listings by title or location..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={() => setProfession('')}
            className={`talent-filter-pill ${!profession ? 'talent-filter-pill--active' : ''}`}
          >
            All
          </button>
          {professions.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setProfession(profession === p ? '' : p)}
              className={`talent-filter-pill ${profession === p ? 'talent-filter-pill--active' : ''}`}
            >
              {titleCase(p)}
            </button>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-2">
        {!isLoading && (
          <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Briefcase className="h-4 w-4 text-primary" />
            <span>
              <span className="font-semibold text-foreground">{total}</span> {total === 1 ? 'listing' : 'listings'}
              {openCount > 0 && (
                <>
                  {' '}
                  · <span className="font-semibold text-foreground">{openCount}</span> open
                </>
              )}
              {hasFilters ? ' matching your search' : ''}
            </span>
          </p>
        )}
        {hasFilters && !isLoading && (
          <button
            type="button"
            onClick={() => {
              setQ('');
              setProfession('');
            }}
            className="text-sm font-medium text-primary hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="grid gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <OrgJobCardSkeleton key={i} />
          ))}
        </div>
      ) : jobs.length ? (
        <div className="grid gap-5">
          {jobs.map((job) => (
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
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Briefcase className="h-10 w-10" />}
          title="No jobs posted yet"
          description="Create your first listing to start receiving applications from qualified professionals."
          action={
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4" /> Post your first job
            </Button>
          }
        />
      )}
    </div>
  );
}

interface MyApplication {
  job_id: string;
}

function ProfessionalJobsBrowse({
  jobs,
  isLoading,
  q,
  setQ,
  profession,
  setProfession,
}: {
  jobs: JobListing[];
  isLoading: boolean;
  q: string;
  setQ: (v: string) => void;
  profession: string;
  setProfession: (v: string) => void;
}) {
  const { data: myApplications } = useQuery({
    queryKey: ['applications', 'me'],
    queryFn: async () => (await api.get<ApiEnvelope<MyApplication[]>>('/applications/me')).data.data,
  });

  const appliedJobIds = new Set(myApplications?.map((a) => a.job_id) ?? []);
  const total = jobs.length;
  const hasFilters = !!q || !!profession;

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <header className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">Browse jobs</h1>
        <p className="text-sm text-muted-foreground">
          Open roles from hospitals, clinics, and care facilities near you.
        </p>
      </header>

      <section className="rounded-xl border border-border/50 bg-card p-4 shadow-sm sm:p-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-10 rounded-lg border-border/60 bg-muted/30 pl-9 shadow-none focus-visible:bg-background"
            placeholder="Search title, city, or keyword..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={() => setProfession('')}
            className={`talent-filter-pill !px-3 !py-1.5 !text-xs ${!profession ? 'talent-filter-pill--active' : ''}`}
          >
            All roles
          </button>
          {professions.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setProfession(profession === p ? '' : p)}
              className={`talent-filter-pill !px-3 !py-1.5 !text-xs ${profession === p ? 'talent-filter-pill--active' : ''}`}
            >
              {titleCase(p)}
            </button>
          ))}
        </div>
      </section>

      <div className="flex items-center justify-between gap-2 px-0.5">
        {!isLoading && (
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{total}</span>{' '}
            {total === 1 ? 'position' : 'positions'}
            {hasFilters ? ' found' : ' available'}
          </p>
        )}
        {hasFilters && !isLoading && (
          <button
            type="button"
            onClick={() => {
              setQ('');
              setProfession('');
            }}
            className="text-sm font-medium text-primary hover:underline"
          >
            Clear
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <ProfessionalJobCardSkeleton key={i} />
          ))}
        </div>
      ) : jobs.length ? (
        <div className="flex flex-col gap-3">
          {jobs.map((job) => (
            <ProfessionalJobCard key={job.id} job={job} applied={appliedJobIds.has(job.id)} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Briefcase className="h-10 w-10" />}
          title="No jobs found"
          description="Try a different search or profession filter. New listings are added regularly."
        />
      )}
    </div>
  );
}

function OrgJobCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border/60">
      <div className="h-1 animate-pulse bg-muted" />
      <div className="space-y-3 p-5">
        <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-3 w-full animate-pulse rounded bg-muted" />
        <div className="flex gap-2">
          <div className="h-6 w-20 animate-pulse rounded-full bg-muted" />
          <div className="h-6 w-24 animate-pulse rounded-full bg-muted" />
        </div>
      </div>
    </div>
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
      toast.success('Job posted successfully');
      qc.invalidateQueries({ queryKey: ['jobs'] });
      onDone();
    },
    onError: (e) => toast.error(apiError(e)),
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <section className="job-form-panel animate-slide-up">
      <div className="border-b border-border/60 px-5 py-4 sm:px-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Create a new listing</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Fill in the details below. You can edit or close the listing anytime.
            </p>
          </div>
          <Button variant="ghost" size="icon" className="shrink-0 rounded-full" onClick={onDone}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate();
        }}
        className="space-y-5 p-5 sm:p-6"
      >
        {/* Role details */}
        <div className="job-form-section">
          <p className="job-form-section-title">
            <FileText className="mr-1.5 inline h-3.5 w-3.5" />
            Role details
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="job-title">Job title</Label>
              <Input
                id="job-title"
                className="h-11 rounded-xl"
                placeholder="e.g. Registered Nurse — Emergency Department"
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="job-profession">Profession</Label>
              <Select
                id="job-profession"
                className="h-11 rounded-xl"
                value={form.profession}
                onChange={(e) => set('profession', e.target.value)}
              >
                {professions.map((p) => (
                  <option key={p} value={p}>
                    {titleCase(p)}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="job-specialization">Specialization</Label>
              <Input
                id="job-specialization"
                className="h-11 rounded-xl"
                placeholder="e.g. ICU, Pediatrics"
                value={form.specialization}
                onChange={(e) => set('specialization', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="job-employment">Employment type</Label>
              <Select
                id="job-employment"
                className="h-11 rounded-xl"
                value={form.employment_type}
                onChange={(e) => set('employment_type', e.target.value)}
              >
                {employmentTypes.map((t) => (
                  <option key={t} value={t}>
                    {titleCase(t)}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="job-experience">Min. experience (years)</Label>
              <Input
                id="job-experience"
                type="number"
                min="0"
                className="h-11 rounded-xl"
                placeholder="Optional"
                value={form.experience_min}
                onChange={(e) => set('experience_min', e.target.value)}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="job-description">Description</Label>
              <Textarea
                id="job-description"
                className="min-h-[120px] rounded-xl"
                placeholder="Describe the role, responsibilities, requirements, and benefits..."
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="job-form-section">
          <p className="job-form-section-title">
            <MapPin className="mr-1.5 inline h-3.5 w-3.5" />
            Location
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="job-city">City</Label>
              <Input
                id="job-city"
                className="h-11 rounded-xl"
                placeholder="e.g. Sofia"
                value={form.city}
                onChange={(e) => set('city', e.target.value)}
              />
            </div>
            <CountrySelect
              id="job-country"
              label="Country"
              value={form.country}
              onChange={(v) => set('country', v)}
              grid
            />
          </div>
        </div>

        {/* Compensation & timeline */}
        <div className="job-form-section">
          <p className="job-form-section-title">
            <DollarSign className="mr-1.5 inline h-3.5 w-3.5" />
            Compensation & timeline
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="job-salary-min">Salary min</Label>
              <Input
                id="job-salary-min"
                type="number"
                min="0"
                className="h-11 rounded-xl"
                placeholder="45000"
                value={form.salary_min}
                onChange={(e) => set('salary_min', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="job-salary-max">Salary max</Label>
              <Input
                id="job-salary-max"
                type="number"
                min="0"
                className="h-11 rounded-xl"
                placeholder="55000"
                value={form.salary_max}
                onChange={(e) => set('salary_max', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="job-expires">
                <Calendar className="mr-1 inline h-3.5 w-3.5" />
                Application deadline
              </Label>
              <Input
                id="job-expires"
                type="date"
                className="h-11 rounded-xl"
                value={form.expires_at}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => set('expires_at', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Optional — closes at end of this date</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 pt-1">
          <Button type="submit" size="lg" className="rounded-xl" disabled={create.isPending}>
            {create.isPending && <Spinner />} Publish listing
          </Button>
          <Button type="button" variant="outline" size="lg" className="rounded-xl" onClick={onDone}>
            Cancel
          </Button>
        </div>
      </form>
    </section>
  );
}
