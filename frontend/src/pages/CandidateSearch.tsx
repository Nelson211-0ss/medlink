import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Search, Bookmark, MapPin, Eye } from 'lucide-react';
import { api, ApiEnvelope, apiError } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Input, Select } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, EmptyState, PageLoader } from '@/components/ui/misc';
import { titleCase } from '@/lib/utils';

interface Pro {
  id: string;
  fullName?: string;
  profession?: string;
  specialization?: string;
  city?: string;
  country?: string;
  experienceYears?: number;
  skills?: string[];
  verificationStatus?: string;
  profileCompletion?: number;
  availability?: string;
  avatar?: string | null;
}

interface SearchResult {
  data: Pro[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

const professions = ['nurse', 'doctor', 'pharmacist', 'lab_technician', 'radiographer', 'midwife', 'physiotherapist', 'caregiver'];

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Find talent</h1>
        <p className="text-muted-foreground">
          Browse every healthcare professional registered on MediLink — visible to all organizations.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by name, skill, specialty, city..."
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

      {!isLoading && (
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-primary">{total}</span> professional{total === 1 ? '' : 's'} available
        </p>
      )}

      {isLoading ? (
        <PageLoader />
      ) : results.length ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {results.map((p) => (
            <Card key={p.id} className="border-primary/10">
              <CardContent className="flex items-start justify-between gap-4 p-5">
                <div className="flex gap-3">
                  <Avatar
                    first={p.fullName?.split(' ')[0]}
                    last={p.fullName?.split(' ')[1]}
                    src={p.avatar}
                    className="h-12 w-12"
                  />
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{p.fullName ?? 'Healthcare professional'}</p>
                      {p.verificationStatus === 'verified' && <Badge variant="default">Verified</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {titleCase(p.profession ?? 'professional')}
                      {p.specialization && ` · ${p.specialization}`}
                      {p.experienceYears ? ` · ${p.experienceYears} yrs` : ''}
                    </p>
                    {(p.city || p.country) && (
                      <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" /> {[p.city, p.country].filter(Boolean).join(', ')}
                      </p>
                    )}
                    {p.availability && (
                      <p className="text-xs text-primary">{titleCase(p.availability.replace(/_/g, ' '))}</p>
                    )}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {(p.skills ?? []).slice(0, 4).map((s) => (
                        <Badge key={s} variant="secondary">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button variant="outline" size="icon" asChild>
                    <Link to={`/candidates/${p.id}`} aria-label="View profile">
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => save.mutate(p.id)} aria-label="Save candidate">
                    <Bookmark className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
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
