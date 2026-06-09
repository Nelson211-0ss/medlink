import { Link } from 'react-router-dom';
import { Bookmark, MapPin, Briefcase, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { titleCase } from '@/lib/utils';

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
  const location = [pro.city, pro.country].filter(Boolean).join(', ');
  const verified = pro.verificationStatus === 'verified';
  const roleLine = [
    titleCase(pro.profession ?? 'professional'),
    pro.specialization,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <article className="talent-card group flex h-full flex-col overflow-hidden rounded-xl bg-card shadow-sm ring-1 ring-border/60 transition-shadow duration-200 hover:shadow-md hover:ring-primary/25">
      <Link to={`/candidates/${pro.id}`} className="relative block aspect-[4/3] shrink-0 overflow-hidden bg-muted">
        <img
          src={photo}
          alt={name}
          className="h-full w-full object-cover object-top"
          loading="lazy"
        />
        {verified && (
          <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-semibold text-primary shadow-sm backdrop-blur-sm dark:bg-slate-900/90">
            <CheckCircle2 className="h-3 w-3" />
            Verified
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-2.5 p-3.5">
        <div>
          <h3 className="text-sm font-bold leading-snug text-foreground">{name}</h3>
          {roleLine && (
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{roleLine}</p>
          )}
        </div>

        <div className="space-y-1 text-xs leading-relaxed text-muted-foreground">
          {pro.experienceYears != null && pro.experienceYears > 0 && (
            <p className="font-medium text-foreground">{pro.experienceYears} years experience</p>
          )}
          {location && (
            <p className="flex items-start gap-1.5">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              <span>{location}</span>
            </p>
          )}
          {pro.availability && (
            <p className="flex items-start gap-1.5 text-primary">
              <Briefcase className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{titleCase(pro.availability.replace(/_/g, ' '))}</span>
            </p>
          )}
        </div>

        {!!pro.skills?.length && (
          <div className="flex flex-wrap gap-1.5">
            {pro.skills.map((s) => (
              <Badge
                key={s}
                variant="outline"
                className="whitespace-normal rounded-md border-border bg-muted/60 px-2 py-0.5 text-xs font-medium leading-snug text-foreground"
              >
                {s}
              </Badge>
            ))}
          </div>
        )}

        <div className="mt-auto flex gap-1.5 pt-1">
          <Button className="h-8 flex-1 text-xs" size="sm" asChild>
            <Link to={`/candidates/${pro.id}`}>View profile</Link>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => onSave(pro.id)}
            disabled={saving}
            aria-label="Save candidate"
          >
            <Bookmark className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </article>
  );
}

export function TalentCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl bg-card shadow-sm ring-1 ring-border/60">
      <div className="aspect-[4/3] animate-pulse bg-muted" />
      <div className="space-y-2.5 p-3.5">
        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-3 w-full animate-pulse rounded bg-muted" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
        <div className="flex flex-wrap gap-1">
          <div className="h-5 w-14 animate-pulse rounded-full bg-muted" />
          <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
        </div>
        <div className="h-8 animate-pulse rounded-lg bg-muted" />
      </div>
    </div>
  );
}
