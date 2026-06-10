import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Briefcase, MapPin, Phone, UserRound } from 'lucide-react';
import { api, ApiEnvelope, apiError } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Label, Select, Textarea } from '@/components/ui/input';
import { PageLoader, Progress, Spinner } from '@/components/ui/misc';
import { ProfilePhotoUpload } from '@/components/ProfilePhotoUpload';
import { OrganizationLogoUpload } from '@/components/OrganizationLogoUpload';
import { CountrySelect } from '@/components/CountrySelect';
import { ProfessionalResumeEditor } from '@/components/ProfessionalResumeEditor';
import { cn, titleCase } from '@/lib/utils';

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
        phone: (form.phone as string) || null,
        contactEmail: (form.contact_email as string) || null,
      });
    }
  };

  const completion = typeof form.profile_completion === 'number' ? (form.profile_completion as number) : null;

  return (
    <div className="space-y-5">
      <div className="dash-page-header">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl dark:text-white">My profile</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {isOrg ? 'Update your facility details.' : 'Update credentials, resume, and contact info.'}
        </p>
      </div>

      <form onSubmit={submit} className="profile-layout">
        <aside className="profile-sidebar">
          <Card className="dash-panel">
            <CardContent className="p-5">
              {isOrg ? (
                <OrganizationLogoUpload
                  stacked
                  logo={form.logo as string | null}
                  organizationName={form.organization_name as string}
                  onUploaded={(url) => {
                    setForm((f) => ({ ...f, logo: url }));
                    qc.invalidateQueries({ queryKey: ['jobs'] });
                  }}
                />
              ) : isPro ? (
                <ProfilePhotoUpload
                  stacked
                  avatar={(form.avatar as string) ?? user.avatar}
                  firstName={user.firstName}
                  lastName={user.lastName}
                  onUploaded={(url) => setForm((f) => ({ ...f, avatar: url }))}
                />
              ) : null}
            </CardContent>
          </Card>

          {isPro && completion !== null && (
            <Card className="dash-panel">
              <CardHeader className="space-y-1 p-4 pb-0">
                <CardTitle className="text-base">Profile completion</CardTitle>
                <CardDescription>Improves job matches.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5 p-4">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="font-medium text-slate-700 dark:text-slate-300">Progress</span>
                  <span className="tabular-nums text-slate-500">{completion}%</span>
                </div>
                <Progress value={completion} />
              </CardContent>
            </Card>
          )}
        </aside>

        <div className="profile-form-main">
          {isOrg ? (
            <>
              <FormSection icon={Briefcase} title="Organization" description="Facility details." cols={3}>
                <Field
                  label="Name"
                  value={form.organization_name}
                  onChange={(v) => set('organization_name', v)}
                  grid
                  maxLength={160}
                />
                <Field
                  label="Type"
                  value={form.organization_type}
                  onChange={(v) => set('organization_type', v)}
                  placeholder="Hospital"
                  grid
                  maxLength={60}
                />
                <Field
                  label="Website"
                  value={form.website}
                  onChange={(v) => set('website', v)}
                  placeholder="https://"
                  grid
                />
                <CountrySelect value={form.country as string} onChange={(v) => set('country', v)} grid />
                <Field
                  label="City"
                  value={form.city}
                  onChange={(v) => set('city', v)}
                  placeholder="Boston, MA"
                  grid
                  maxLength={80}
                />
                <Field
                  label="Address"
                  value={form.address}
                  onChange={(v) => set('address', v)}
                  placeholder="Street address"
                  grid
                  maxLength={400}
                />
              </FormSection>

              <FormSection icon={UserRound} title="About" description="Short overview.">
                <TextareaField
                  label="Description"
                  value={form.description}
                  onChange={(v) => set('description', v)}
                  placeholder="Mission and specialties."
                  rows={4}
                  maxLength={4000}
                />
              </FormSection>
            </>
          ) : (
            <>
              <FormSection icon={Phone} title="Contact" description="How recruiters reach you.">
                <FieldCluster>
                  <Field
                    label="Phone"
                    type="tel"
                    value={form.phone}
                    onChange={(v) => set('phone', v)}
                    placeholder="+1 555 000 0000"
                    size="lg"
                    maxLength={30}
                  />
                  <Field
                    label="Email"
                    type="email"
                    value={form.contact_email}
                    onChange={(v) => set('contact_email', v)}
                    placeholder={form.email as string}
                    size="lg"
                    maxLength={320}
                    hint={form.email ? `Uses ${form.email as string} if empty.` : undefined}
                  />
                </FieldCluster>
              </FormSection>

              <FormSection icon={MapPin} title="Location" description="Where you work.">
                <FieldCluster>
                  <CountrySelect value={form.country as string} onChange={(v) => set('country', v)} />
                  <Field
                    label="City"
                    value={form.city}
                    onChange={(v) => set('city', v)}
                    placeholder="Boston, MA"
                    size="md"
                    maxLength={80}
                  />
                </FieldCluster>
              </FormSection>

              <FormSection icon={Briefcase} title="Credentials" description="Role and experience." cols={3}>
                <SelectField
                  label="Profession"
                  value={form.profession as string}
                  onChange={(v) => set('profession', v)}
                  placeholder="Select..."
                  grid
                  options={professions.map((p) => ({ value: p, label: titleCase(p) }))}
                />
                <Field
                  label="Specialty"
                  value={form.specialization}
                  onChange={(v) => set('specialization', v)}
                  placeholder="ICU"
                  grid
                  maxLength={120}
                />
                <Field
                  label="Years"
                  type="number"
                  value={form.experience_years}
                  onChange={(v) => set('experience_years', v)}
                  placeholder="0"
                  grid
                />
                <SelectField
                  label="Availability"
                  value={form.availability as string}
                  onChange={(v) => set('availability', v)}
                  placeholder="Select..."
                  grid
                  options={availabilities.map((a) => ({ value: a, label: titleCase(a) }))}
                />
                <Field
                  label="License #"
                  value={form.license_number}
                  onChange={(v) => set('license_number', v)}
                  placeholder="LIC-123456"
                  grid
                  maxLength={120}
                />
                <Field
                  label="Salary (USD)"
                  type="number"
                  value={form.salary_expectation}
                  onChange={(v) => set('salary_expectation', v)}
                  placeholder="95000"
                  grid
                />
              </FormSection>

              <FormSection icon={UserRound} title="Skills & bio" description="Expertise summary.">
                <Field
                  label="Skills"
                  value={Array.isArray(form.skills) ? (form.skills as string[]).join(', ') : form.skills}
                  onChange={(v) => set('skills', v)}
                  placeholder="ICU, ACLS"
                  row
                  hint="Comma-separated."
                />
                <TextareaField
                  label="Professional summary"
                  value={form.bio}
                  onChange={(v) => set('bio', v)}
                  placeholder="Brief overview for your resume — experience, strengths, and goals."
                  rows={4}
                  maxLength={4000}
                />
              </FormSection>

              <ProfessionalResumeEditor
                data={{
                  cv_url: form.cv_url as string | null,
                  workExperience: form.workExperience as never,
                  education: form.education as never,
                  certifications: form.certifications as never,
                  licenses: form.licenses as never,
                }}
              />
            </>
          )}

          <Card className="dash-panel profile-section-card">
            <CardContent className="flex items-center justify-between gap-4 p-4">
              <p className="text-sm text-muted-foreground">{save.isPending ? 'Saving…' : 'Save to apply.'}</p>
              <Button type="submit" disabled={save.isPending} className="shrink-0 sm:min-w-[120px]">
                {save.isPending && <Spinner />} Save
              </Button>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}

function FieldCluster({ children }: { children: React.ReactNode }) {
  return <div className="profile-field-cluster">{children}</div>;
}

function FormSection({
  icon: Icon,
  title,
  description,
  children,
  cols,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
  cols?: 3;
}) {
  return (
    <Card className="dash-panel profile-section-card overflow-hidden">
      <CardHeader className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="dash-stat-icon dash-stat-icon-blue shrink-0">
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription className="mt-0.5">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className={cn('profile-section-grid p-4', cols === 3 && 'profile-section-grid--3')}>
        {children}
      </CardContent>
    </Card>
  );
}

type FieldSize = 'sm' | 'md' | 'lg' | 'xl' | 'address';

const FIELD_WIDTH: Record<FieldSize, string> = {
  sm: 'profile-field--sm',
  md: 'profile-field--md',
  lg: 'profile-field--lg',
  xl: 'profile-field--xl',
  address: 'profile-field--address',
};

function fieldWidthClass(size: FieldSize, opts?: { row?: boolean; grid?: boolean }) {
  if (opts?.grid) return cn('profile-field', 'profile-field--grid');
  if (opts?.row) return cn('profile-field', 'profile-field--row');
  return cn('profile-field', FIELD_WIDTH[size]);
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  row,
  grid,
  hint,
  placeholder,
  size = 'lg',
  maxLength,
}: {
  label: string;
  value: unknown;
  onChange: (v: string) => void;
  type?: string;
  row?: boolean;
  grid?: boolean;
  hint?: string;
  placeholder?: string;
  size?: FieldSize;
  maxLength?: number;
}) {
  return (
    <div className={fieldWidthClass(size, { row, grid })}>
      <Label>{label}</Label>
      <Input
        type={type}
        value={(value as string) ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className="w-full"
      />
      {hint && <p className="text-xs leading-snug text-muted-foreground">{hint}</p>}
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  size = 'lg',
  grid,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  size?: FieldSize;
  grid?: boolean;
}) {
  return (
    <div className={fieldWidthClass(size, { grid })}>
      <Label>{label}</Label>
      <Select value={value ?? ''} onChange={(e) => onChange(e.target.value)} className="w-full">
        <option value="">{placeholder ?? 'Select...'}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
    </div>
  );
}

function TextareaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
  hint,
  maxLength,
}: {
  label: string;
  value: unknown;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  hint?: string;
  maxLength?: number;
}) {
  return (
    <div className="profile-field profile-field--area">
      <Label>{label}</Label>
      <Textarea
        value={(value as string) ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        className="min-h-0 w-full resize-y"
      />
      {hint && <p className="text-xs leading-snug text-muted-foreground">{hint}</p>}
    </div>
  );
}
