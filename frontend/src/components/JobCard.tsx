import { Link } from 'react-router-dom';
import {
  Briefcase,
  Calendar,
  Clock,
  DollarSign,
  MapPin,
  Trash2,
} from 'lucide-react';
import { JobApplyButton } from '@/components/JobApplyButton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, timeAgo, titleCase } from '@/lib/utils';

export interface JobListing {
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
  organization_logo?: string | null;
  created_at: string;
}

function formatDeadline(date?: string | null) {
  if (!date) return null;
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function isDeadlinePassed(date?: string | null) {
  return !!date && new Date(date) < new Date();
}

export function isJobClosed(job: JobListing) {
  return job.status !== 'open' || isDeadlinePassed(job.expires_at);
}

function daysUntilDeadline(date?: string | null) {
  if (!date) return null;
  return Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function formatSalaryRange(min?: number, max?: number, currency?: string) {
  const cur = currency ?? 'USD';
  if (min == null && max == null) return null;
  if (min != null && max != null) return `${formatCurrency(min, cur)} – ${formatCurrency(max, cur)}`;
  return formatCurrency(min ?? max, cur);
}

function OrgLogo({ job }: { job: JobListing }) {
  const name = job.organization_name ?? 'Organization';
  const initial = name.trim().charAt(0).toUpperCase();

  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/60 bg-muted/40 sm:h-14 sm:w-14">
      {job.organization_logo ? (
        <img src={job.organization_logo} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="text-lg font-bold text-primary">{initial}</span>
      )}
    </div>
  );
}

function DeadlineBadge({ expiresAt, closed }: { expiresAt?: string | null; closed?: boolean }) {
  if (!expiresAt) return null;
  const days = daysUntilDeadline(expiresAt);

  if (closed) {
    return (
      <span className="pro-job-tag pro-job-tag--muted">
        <Calendar className="h-3 w-3" />
        Closed
      </span>
    );
  }

  const urgent = days != null && days >= 0 && days <= 7;
  return (
    <span className={`pro-job-tag ${urgent ? 'pro-job-tag--urgent' : 'pro-job-tag--active'}`}>
      <Calendar className="h-3 w-3" />
      {days != null && days <= 0 ? 'Closes today' : `Closes ${formatDeadline(expiresAt)}`}
    </span>
  );
}

/** Clean list card for professionals browsing jobs */
export function ProfessionalJobCard({
  job,
  applied,
}: {
  job: JobListing;
  applied?: boolean;
}) {
  const salary = formatSalaryRange(job.salary_min, job.salary_max, job.currency);
  const location = [job.city, job.country].filter(Boolean).join(', ');
  const closed = isJobClosed(job);

  return (
    <article className="pro-job-card group">
      <Link to={`/jobs/${job.id}`} className="shrink-0">
        <OrgLogo job={job} />
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
          <div className="min-w-0">
            <Link
              to={`/jobs/${job.id}`}
              className="text-base font-semibold leading-snug text-foreground transition-colors hover:text-primary sm:text-lg"
            >
              {job.title}
            </Link>
            {job.organization_name && (
              <p className="mt-0.5 text-sm text-muted-foreground">{job.organization_name}</p>
            )}
          </div>
          {salary && <p className="shrink-0 text-sm font-semibold text-foreground">{salary}</p>}
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          {job.profession && (
            <span className="pro-job-tag">
              <Briefcase className="h-3 w-3" />
              {titleCase(job.profession)}
            </span>
          )}
          {location && (
            <span className="pro-job-tag">
              <MapPin className="h-3 w-3" />
              {location}
            </span>
          )}
          {job.employment_type && (
            <span className="pro-job-tag">{titleCase(job.employment_type)}</span>
          )}
          <span className="pro-job-tag pro-job-tag--muted">
            <Clock className="h-3 w-3" />
            {timeAgo(job.created_at)}
          </span>
          <DeadlineBadge expiresAt={job.expires_at} closed={closed} />
        </div>

        {job.description && (
          <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{job.description}</p>
        )}
      </div>

      <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
        <JobApplyButton jobId={job.id} closed={closed} applied={applied} />
        <Button variant="ghost" size="sm" className="hidden text-xs text-muted-foreground sm:inline-flex" asChild>
          <Link to={`/jobs/${job.id}`}>View details</Link>
        </Button>
      </div>
    </article>
  );
}

export function ProfessionalJobCardSkeleton() {
  return (
    <div className="pro-job-card">
      <div className="h-12 w-12 shrink-0 animate-pulse rounded-xl bg-muted sm:h-14 sm:w-14" />
      <div className="min-w-0 flex-1 space-y-2.5">
        <div className="flex justify-between gap-4">
          <div className="space-y-1.5">
            <div className="h-5 w-48 animate-pulse rounded bg-muted" />
            <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          </div>
          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="h-6 w-16 animate-pulse rounded-full bg-muted" />
          <div className="h-6 w-20 animate-pulse rounded-full bg-muted" />
          <div className="h-6 w-14 animate-pulse rounded-full bg-muted" />
        </div>
        <div className="h-4 w-full animate-pulse rounded bg-muted" />
      </div>
      <div className="h-9 w-24 shrink-0 animate-pulse rounded-lg bg-muted" />
    </div>
  );
}

function JobMeta({ job }: { job: JobListing }) {
  const location = [job.city, job.country].filter(Boolean).join(', ');

  return (
    <div className="flex flex-wrap gap-2">
      {job.profession && (
        <span className="job-meta-chip">
          <Briefcase className="h-3.5 w-3.5 shrink-0 text-primary" />
          {titleCase(job.profession)}
        </span>
      )}
      {location && (
        <span className="job-meta-chip">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
          {location}
        </span>
      )}
      {job.employment_type && (
        <Badge variant="secondary" className="rounded-full px-2.5 py-0.5 text-[11px] font-medium">
          {titleCase(job.employment_type)}
        </Badge>
      )}
    </div>
  );
}

/** @deprecated Use ProfessionalJobCard for professional browse */
export function JobCard({ job }: { job: JobListing }) {
  return <ProfessionalJobCard job={job} />;
}

export function OrgJobCard({
  job,
  onDelete,
  deleting,
}: {
  job: JobListing;
  onDelete: () => void;
  deleting?: boolean;
}) {
  const closed = job.status !== 'open' || isDeadlinePassed(job.expires_at);
  const salary = formatSalaryRange(job.salary_min, job.salary_max, job.currency);

  return (
    <article className="job-card flex flex-col overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border/60 sm:flex-row">
      <div className={`job-card-accent sm:w-1.5 sm:shrink-0 ${closed ? 'opacity-40' : ''}`} />

      <div className="flex min-w-0 flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <Link
              to={`/jobs/${job.id}`}
              className="text-lg font-bold leading-snug text-foreground hover:text-primary hover:underline"
            >
              {job.title}
            </Link>
            {job.description && (
              <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">{job.description}</p>
            )}
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            {closed ? (
              <Badge variant="secondary" className="rounded-full">
                Closed
              </Badge>
            ) : (
              <Badge variant="success" className="rounded-full">
                Open
              </Badge>
            )}
            <DeadlineBadge expiresAt={job.expires_at} closed={closed} />
          </div>
        </div>

        <JobMeta job={job} />

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-3">
          <div className="space-y-0.5">
            {salary && (
              <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <DollarSign className="h-4 w-4 text-primary" />
                {salary}
              </p>
            )}
            <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              Posted {timeAgo(job.created_at)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to={`/jobs/${job.id}`}>View</Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              disabled={deleting}
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}

export function JobCardSkeleton() {
  return <ProfessionalJobCardSkeleton />;
}
