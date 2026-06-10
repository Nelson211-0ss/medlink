import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { api, ApiEnvelope } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { ProfessionalResumeView } from '@/components/ProfessionalResumeView';
import { PageLoader } from '@/components/ui/misc';
import type { ProfessionalResume } from '@/types/resume';

export default function CandidateDetail() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ['candidate', id],
    queryFn: async () =>
      (await api.get<ApiEnvelope<ProfessionalResume>>(`/professionals/${id}`)).data.data,
    enabled: !!id,
  });

  if (isLoading) return <PageLoader />;
  if (!data) return <p className="text-muted-foreground">Professional not found.</p>;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" asChild className="-ml-2 h-9 px-2">
          <Link to="/candidates">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to talent search
          </Link>
        </Button>
      </div>

      <ProfessionalResumeView data={data} />
    </div>
  );
}
