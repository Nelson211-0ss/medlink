import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Search, Users, Sparkles } from 'lucide-react';
import { api, ApiEnvelope, apiError } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/misc';
import { TalentCard, TalentCardSkeleton, type TalentPro } from '@/components/TalentCard';
import { titleCase } from '@/lib/utils';
import { nurseSlides, professionPortraits } from '@/lib/images';

interface SearchResult {
  data: TalentPro[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

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

function proPhoto(pro: TalentPro, index: number): string {
  if (pro.avatar) return pro.avatar;
  if (pro.profession && professionPortraits[pro.profession]) {
    return professionPortraits[pro.profession];
  }
  return nurseSlides[index % nurseSlides.length].src;
}

export default function CandidateSearch() {
  const [q, setQ] = useState('');
  const [profession, setProfession] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['candidate-search', q, profession],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (profession) params.set('profession', profession);
      params.set('limit', '50');
      return (await api.get<ApiEnvelope<SearchResult>>(`/search/professionals?${params}`)).data.data;
    },
  });

  const save = useMutation({
    mutationFn: async (id: string) => (await api.post(`/saved/candidates/${id}`)).data,
    onSuccess: () => toast.success('Candidate saved'),
    onError: (e) => toast.error(apiError(e)),
  });

  const results = data?.data ?? [];
  const total = data?.meta?.total ?? results.length;
  const hasFilters = !!q || !!profession;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="talent-hero">
        <div className="relative z-10 max-w-2xl">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Talent directory
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Find talent</h1>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
            Discover verified healthcare professionals ready to join your team. Browse profiles, compare
            skills, and connect with the right fit.
          </p>
        </div>
      </section>

      {/* Search & filters */}
      <section className="talent-search-bar space-y-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-11 rounded-xl border-border/60 bg-muted/40 pl-10 text-base shadow-none focus-visible:bg-background"
            placeholder="Search by name, skill, specialty, or city..."
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

      {/* Results header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {!isLoading && (
          <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4 text-primary" />
            <span>
              <span className="font-semibold text-foreground">{total}</span> professional
              {total === 1 ? '' : 's'}
              {hasFilters ? ' matching your search' : ' available'}
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

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <TalentCardSkeleton key={i} />
          ))}
        </div>
      ) : results.length ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {results.map((p, i) => (
            <TalentCard
              key={p.id}
              pro={p}
              photo={proPhoto(p, i)}
              onSave={(id) => save.mutate(id)}
              saving={save.isPending}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Search className="h-10 w-10" />}
          title="No professionals found"
          description="Try adjusting your search or filters. New professionals appear here as soon as they register."
        />
      )}
    </div>
  );
}
