import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Search, Bookmark, MapPin } from 'lucide-react';
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
      return (await api.get<ApiEnvelope<{ data: Pro[] }>>(`/search/professionals?${params}`)).data.data;
    },
  });

  const save = useMutation({
    mutationFn: async (id: string) => (await api.post(`/saved/candidates/${id}`)).data,
    onSuccess: () => toast.success('Candidate saved'),
    onError: (e) => toast.error(apiError(e)),
  });

  const results = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Find talent</h1>
        <p className="text-muted-foreground">Search verified healthcare professionals.</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search by name, skill, specialty..." value={q} onChange={(e) => setQ(e.target.value)} />
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
      ) : results.length ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {results.map((p) => (
            <Card key={p.id}>
              <CardContent className="flex items-start justify-between gap-4 p-5">
                <div className="flex gap-3">
                  <Avatar first={p.fullName?.split(' ')[0]} last={p.fullName?.split(' ')[1]} className="h-12 w-12" />
                  <div className="space-y-1.5">
                    <p className="font-semibold">{p.fullName ?? 'Healthcare professional'}</p>
                    <p className="text-sm text-muted-foreground">
                      {titleCase(p.profession)} {p.specialization && `· ${p.specialization}`}
                    </p>
                    {(p.city || p.country) && (
                      <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" /> {[p.city, p.country].filter(Boolean).join(', ')}
                      </p>
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
                <Button variant="outline" size="icon" onClick={() => save.mutate(p.id)}>
                  <Bookmark className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Search className="h-10 w-10" />}
          title="No candidates found"
          description="Elasticsearch returns results once professionals are indexed. Run the seed + reindex scripts."
        />
      )}
    </div>
  );
}
