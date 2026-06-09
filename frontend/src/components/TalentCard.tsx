import { Link } from 'react-router-dom';
import { Bookmark, MapPin, Briefcase, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { initials, titleCase } from '@/lib/utils';

export interface TalentPro {
  id: string;
  fullName?: string;
  profession?: string;
  specialization?: string;
  city?: string;
  country?: string;
  experienceYears?: number;
  skills?: string[];
  verificationStatus?: string;
  availability?: string;
  avatar?: string | null;
}

interface TalentCardProps {
  pro: TalentPro;
  photo: string;
  onSave: (id: string) => void;
  saving?: boolean;
}

export function TalentCard({ pro, photo, onSave, saving }: TalentCardProps) {
  const name = pro.fullName ?? 'Healthcare professional';
  const [first, last] = name.split(' ');
  const location = [pro.city, pro.country].filter(Boolean).join(', ');
  const verified = pro.verificationStatus === 'verified';

  return (
    <article className="talent-card group flex flex-col overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:ring-primary/25">
      <Link to={`/candidates/${pro.id}`} className="relative block aspect-[4/5] overflow-hidden bg-muted">
        <img
          src={photo}
          alt={name}
          className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

        {verified && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-primary shadow-sm backdrop-blur-sm dark:bg-slate-900/90">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Verified
          </span>
        )}

        <div className="absolute inset-x-0 bottom-0 p-4">
          <div className="flex items-end gap-3">
            {!pro.avatar && (
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/90 text-sm font-bold text-white shadow-md">
                {initials(first, last)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-lg font-bold leading-tight text-white">{name}</h3>
              <p className="mt-0.5 truncate text-sm text-white/85">
                {titleCase(pro.profession ?? 'professional')}
                {pro.specialization && ` · ${pro.specialization}`}
              </p>
            </div>
          </div>
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="space-y-1.5 text-sm text-muted-foreground">
          {pro.experienceYears != null && pro.experienceYears > 0 && (
            <p className="font-medium text-foreground">{pro.experienceYears} years experience</p>
          )}
          {location && (
            <p className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
              <span className="truncate">{location}</span>
            </p>
          )}
          {pro.availability && (
            <p className="inline-flex items-center gap-1.5 text-primary">
              <Briefcase className="h-3.5 w-3.5 shrink-0" />
              {titleCase(pro.availability.replace(/_/g, ' '))}
            </p>
          )}
        </div>

        {!!pro.skills?.length && (
          <div className="flex flex-wrap gap-1.5">
            {pro.skills.slice(0, 3).map((s) => (
              <Badge key={s} variant="secondary" className="text-[11px]">
                {s}
              </Badge>
            ))}
            {pro.skills.length > 3 && (
              <Badge variant="outline" className="text-[11px]">
                +{pro.skills.length - 3}
              </Badge>
            )}
          </div>
        )}

        <div className="mt-auto flex gap-2 pt-1">
          <Button className="flex-1" size="sm" asChild>
            <Link to={`/candidates/${pro.id}`}>View profile</Link>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="shrink-0"
            onClick={() => onSave(pro.id)}
            disabled={saving}
            aria-label="Save candidate"
          >
            <Bookmark className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </article>
  );
}

export function TalentCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border/60">
      <div className="aspect-[4/5] animate-pulse bg-muted" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
        <div className="flex gap-2">
          <div className="h-6 w-16 animate-pulse rounded-full bg-muted" />
          <div className="h-6 w-16 animate-pulse rounded-full bg-muted" />
        </div>
        <div className="h-9 animate-pulse rounded-lg bg-muted" />
      </div>
    </div>
  );
}
