import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, MapPin, Mail, Briefcase } from 'lucide-react';
import { api, ApiEnvelope } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, PageLoader } from '@/components/ui/misc';
import { titleCase } from '@/lib/utils';

interface Profile {
  id: string;
  profession?: string;
  specialization?: string;
  experience_years?: number;
  bio?: string;
  availability?: string;
  salary_expectation?: number;
  city?: string;
  country?: string;
  skills?: string[];
  verification_status?: string;
  profile_completion?: number;
  license_number?: string;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string | null;
  };
  education?: { institution: string; degree?: string; field_of_study?: string }[];
  certifications?: { name: string; issuing_body?: string }[];
  licenses?: { license_type: string; license_number?: string; country?: string }[];
  workExperience?: { title: string; organization?: string; location?: string }[];
}

export default function CandidateDetail() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ['candidate', id],
    queryFn: async () =>
      (await api.get<ApiEnvelope<Profile>>(`/professionals/${id}`)).data.data,
    enabled: !!id,
  });

  if (isLoading) return <PageLoader />;
  if (!data) return <p className="text-muted-foreground">Professional not found.</p>;

  const name = data.user ? `${data.user.firstName} ${data.user.lastName}` : 'Healthcare professional';

  return (
    <div className="space-y-6">
      <Button variant="ghost" asChild className="-ml-2">
        <Link to="/candidates">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to talent search
        </Link>
      </Button>

      <Card className="border-primary/10">
        <CardContent className="flex flex-col gap-6 p-6 sm:flex-row sm:items-start">
          <Avatar
            first={data.user?.firstName}
            last={data.user?.lastName}
            src={data.user?.avatar}
            className="h-20 w-20 text-lg"
          />
          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold">{name}</h1>
              {data.verification_status === 'verified' && <Badge>Verified</Badge>}
            </div>
            <p className="text-muted-foreground">
              {titleCase(data.profession ?? 'professional')}
              {data.specialization && ` · ${data.specialization}`}
              {data.experience_years ? ` · ${data.experience_years} years experience` : ''}
            </p>
            {(data.city || data.country) && (
              <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" /> {[data.city, data.country].filter(Boolean).join(', ')}
              </p>
            )}
            {data.user?.email && (
              <p className="inline-flex items-center gap-1.5 text-sm">
                <Mail className="h-4 w-4 text-primary" />
                <a href={`mailto:${data.user.email}`} className="text-primary hover:underline">
                  {data.user.email}
                </a>
              </p>
            )}
            {data.availability && (
              <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <Briefcase className="h-4 w-4" /> {titleCase(data.availability.replace(/_/g, ' '))}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {(data.skills ?? []).map((s) => (
                <Badge key={s} variant="secondary">
                  {s}
                </Badge>
              ))}
            </div>
            {data.bio && <p className="text-sm leading-relaxed text-muted-foreground">{data.bio}</p>}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {!!data.workExperience?.length && (
          <Card className="border-primary/10">
            <CardHeader>
              <CardTitle>Experience</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.workExperience.map((w, i) => (
                <div key={i} className="rounded-lg border border-primary/10 p-3">
                  <p className="font-medium">{w.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {[w.organization, w.location].filter(Boolean).join(' · ')}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {!!data.licenses?.length && (
          <Card className="border-primary/10">
            <CardHeader>
              <CardTitle>Licenses</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.licenses.map((l, i) => (
                <div key={i} className="rounded-lg border border-primary/10 p-3">
                  <p className="font-medium">{l.license_type}</p>
                  <p className="text-sm text-muted-foreground">
                    {[l.license_number, l.country].filter(Boolean).join(' · ')}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {!!data.education?.length && (
          <Card className="border-primary/10">
            <CardHeader>
              <CardTitle>Education</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.education.map((e, i) => (
                <div key={i} className="rounded-lg border border-primary/10 p-3">
                  <p className="font-medium">{e.institution}</p>
                  <p className="text-sm text-muted-foreground">
                    {[e.degree, e.field_of_study].filter(Boolean).join(' · ')}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {!!data.certifications?.length && (
          <Card className="border-primary/10">
            <CardHeader>
              <CardTitle>Certifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.certifications.map((c, i) => (
                <div key={i} className="rounded-lg border border-primary/10 p-3">
                  <p className="font-medium">{c.name}</p>
                  {c.issuing_body && <p className="text-sm text-muted-foreground">{c.issuing_body}</p>}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
