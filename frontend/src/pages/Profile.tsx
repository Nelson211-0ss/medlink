import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, ApiEnvelope, apiError } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Label, Select, Textarea } from '@/components/ui/input';
import { PageLoader, Progress, Spinner } from '@/components/ui/misc';
import { ProfilePhotoUpload } from '@/components/ProfilePhotoUpload';

const professions = ['nurse', 'doctor', 'pharmacist', 'lab_technician', 'radiographer', 'midwife', 'physiotherapist', 'caregiver'];
const availabilities = ['full_time', 'part_time', 'contract', 'locum', 'remote'];

export default function Profile() {
  const user = useAuthStore((s) => s.user)!;
  const isOrg = user.role === 'organization';
  const isPro = user.role === 'professional';
  const endpoint = isOrg ? '/organizations/me' : '/professionals/me';
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['my-profile', user.role],
    queryFn: async () => (await api.get<ApiEnvelope<Record<string, unknown>>>(endpoint)).data.data,
  });

  const [form, setForm] = useState<Record<string, unknown>>({});
  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const save = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => (await api.patch(endpoint, payload)).data,
    onSuccess: () => {
      toast.success('Profile saved');
      qc.invalidateQueries({ queryKey: ['my-profile'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (e) => toast.error(apiError(e)),
  });

  if (isLoading) return <PageLoader />;
  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isOrg) {
      save.mutate({
        organization_name: form.organization_name,
        organization_type: form.organization_type,
        website: form.website || undefined,
        description: form.description,
        country: form.country,
        city: form.city,
        address: form.address,
      });
    } else {
      save.mutate({
        profession: form.profession,
        specialization: form.specialization,
        experience_years: Number(form.experience_years) || 0,
        bio: form.bio,
        availability: form.availability,
        salary_expectation: form.salary_expectation ? Number(form.salary_expectation) : undefined,
        country: form.country,
        city: form.city,
        license_number: form.license_number,
        skills: typeof form.skills === 'string' ? (form.skills as string).split(',').map((s) => s.trim()) : form.skills,
      });
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">My profile</h1>

      {isPro && (
        <Card>
          <CardContent className="p-5">
            <ProfilePhotoUpload
              avatar={(form.avatar as string) ?? user.avatar}
              firstName={user.firstName}
              lastName={user.lastName}
              onUploaded={(url) => setForm((f) => ({ ...f, avatar: url }))}
            />
          </CardContent>
        </Card>
      )}

      {!isOrg && typeof form.profile_completion === 'number' && (
        <Card>
          <CardContent className="space-y-2 p-5">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Profile completion</span>
              <span className="text-muted-foreground">{form.profile_completion as number}%</span>
            </div>
            <Progress value={form.profile_completion as number} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{isOrg ? 'Organization details' : 'Professional details'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
            {isOrg ? (
              <>
                <Field label="Organization name" value={form.organization_name} onChange={(v) => set('organization_name', v)} />
                <Field label="Type" value={form.organization_type} onChange={(v) => set('organization_type', v)} />
                <Field label="Website" value={form.website} onChange={(v) => set('website', v)} />
                <Field label="Country" value={form.country} onChange={(v) => set('country', v)} />
                <Field label="City" value={form.city} onChange={(v) => set('city', v)} />
                <Field label="Address" value={form.address} onChange={(v) => set('address', v)} />
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Description</Label>
                  <Textarea value={(form.description as string) ?? ''} onChange={(e) => set('description', e.target.value)} />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label>Profession</Label>
                  <Select value={(form.profession as string) ?? ''} onChange={(e) => set('profession', e.target.value)}>
                    <option value="">Select...</option>
                    {professions.map((p) => (
                      <option key={p} value={p}>
                        {p.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </Select>
                </div>
                <Field label="Specialization" value={form.specialization} onChange={(v) => set('specialization', v)} />
                <Field label="Experience (years)" type="number" value={form.experience_years} onChange={(v) => set('experience_years', v)} />
                <div className="space-y-1.5">
                  <Label>Availability</Label>
                  <Select value={(form.availability as string) ?? ''} onChange={(e) => set('availability', e.target.value)}>
                    <option value="">Select...</option>
                    {availabilities.map((a) => (
                      <option key={a} value={a}>
                        {a.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </Select>
                </div>
                <Field label="Salary expectation" type="number" value={form.salary_expectation} onChange={(v) => set('salary_expectation', v)} />
                <Field label="License number" value={form.license_number} onChange={(v) => set('license_number', v)} />
                <Field label="Country" value={form.country} onChange={(v) => set('country', v)} />
                <Field label="City" value={form.city} onChange={(v) => set('city', v)} />
                <Field
                  label="Skills (comma separated)"
                  value={Array.isArray(form.skills) ? (form.skills as string[]).join(', ') : form.skills}
                  onChange={(v) => set('skills', v)}
                  full
                />
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Bio</Label>
                  <Textarea value={(form.bio as string) ?? ''} onChange={(e) => set('bio', e.target.value)} />
                </div>
              </>
            )}
            <div className="sm:col-span-2">
              <Button type="submit" disabled={save.isPending}>
                {save.isPending && <Spinner />} Save changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  full,
}: {
  label: string;
  value: unknown;
  onChange: (v: string) => void;
  type?: string;
  full?: boolean;
}) {
  return (
    <div className={`space-y-1.5 ${full ? 'sm:col-span-2' : ''}`}>
      <Label>{label}</Label>
      <Input type={type} value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
