import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Briefcase, FileText, GraduationCap, Award, Shield, Trash2 } from 'lucide-react';
import { api, apiError } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Label, Textarea } from '@/components/ui/input';
import { Spinner } from '@/components/ui/misc';
import { CvUpload } from '@/components/CvUpload';
import { formatDateRange, formatResumeDate, formatYearRange } from '@/lib/resume';
import type { Certification, Education, License, WorkExperience } from '@/types/resume';

interface ResumeData {
  cv_url?: string | null;
  workExperience?: WorkExperience[];
  education?: Education[];
  certifications?: Certification[];
  licenses?: License[];
}

export function ProfessionalResumeEditor({ data }: { data: ResumeData }) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['my-profile'] });

  const [expForm, setExpForm] = useState({
    title: '',
    organization: '',
    location: '',
    startDate: '',
    endDate: '',
    isCurrent: false,
    description: '',
  });
  const [eduForm, setEduForm] = useState({
    institution: '',
    degree: '',
    fieldOfStudy: '',
    startYear: '',
    endYear: '',
    description: '',
  });
  const [certForm, setCertForm] = useState({ name: '', issuingBody: '', issueDate: '' });
  const [licenseForm, setLicenseForm] = useState({
    licenseType: '',
    licenseNumber: '',
    country: '',
    issueDate: '',
  });

  const addExperience = useMutation({
    mutationFn: async () =>
      (await api.post('/professionals/me/experience', {
        title: expForm.title,
        organization: expForm.organization || undefined,
        location: expForm.location || undefined,
        startDate: expForm.startDate || undefined,
        endDate: expForm.isCurrent ? undefined : expForm.endDate || undefined,
        isCurrent: expForm.isCurrent,
        description: expForm.description || undefined,
      })).data,
    onSuccess: () => {
      toast.success('Experience added');
      setExpForm({ title: '', organization: '', location: '', startDate: '', endDate: '', isCurrent: false, description: '' });
      invalidate();
    },
    onError: (e) => toast.error(apiError(e)),
  });

  const addEducation = useMutation({
    mutationFn: async () =>
      (await api.post('/professionals/me/education', {
        institution: eduForm.institution,
        degree: eduForm.degree || undefined,
        fieldOfStudy: eduForm.fieldOfStudy || undefined,
        startYear: eduForm.startYear ? Number(eduForm.startYear) : undefined,
        endYear: eduForm.endYear ? Number(eduForm.endYear) : undefined,
        description: eduForm.description || undefined,
      })).data,
    onSuccess: () => {
      toast.success('Education added');
      setEduForm({ institution: '', degree: '', fieldOfStudy: '', startYear: '', endYear: '', description: '' });
      invalidate();
    },
    onError: (e) => toast.error(apiError(e)),
  });

  const addCert = useMutation({
    mutationFn: async () =>
      (await api.post('/professionals/me/certifications', {
        name: certForm.name,
        issuingBody: certForm.issuingBody || undefined,
        issueDate: certForm.issueDate || undefined,
      })).data,
    onSuccess: () => {
      toast.success('Certification added');
      setCertForm({ name: '', issuingBody: '', issueDate: '' });
      invalidate();
    },
    onError: (e) => toast.error(apiError(e)),
  });

  const addLicense = useMutation({
    mutationFn: async () =>
      (await api.post('/professionals/me/licenses', {
        licenseType: licenseForm.licenseType,
        licenseNumber: licenseForm.licenseNumber || undefined,
        country: licenseForm.country || undefined,
        issueDate: licenseForm.issueDate || undefined,
      })).data,
    onSuccess: () => {
      toast.success('License added');
      setLicenseForm({ licenseType: '', licenseNumber: '', country: '', issueDate: '' });
      invalidate();
    },
    onError: (e) => toast.error(apiError(e)),
  });

  const remove = useMutation({
    mutationFn: async ({ type, id }: { type: string; id: string }) =>
      (await api.delete(`/professionals/me/${type}/${id}`)).data,
    onSuccess: () => {
      toast.success('Removed');
      invalidate();
    },
    onError: (e) => toast.error(apiError(e)),
  });

  return (
    <div className="space-y-4">
      <Card className="dash-panel profile-section-card overflow-hidden">
        <CardHeader className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="dash-stat-icon dash-stat-icon-blue shrink-0">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base">Resume & CV</CardTitle>
              <CardDescription className="mt-0.5">
                Build your resume — organizations see this when viewing your profile.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <CvUpload
            cvUrl={data.cv_url}
            onUploaded={() => invalidate()}
          />
        </CardContent>
      </Card>

      <ResumeSection
        icon={Briefcase}
        title="Work experience"
        description="Roles, facilities, and responsibilities."
      >
        {!!data.workExperience?.length && (
          <div className="mb-4 space-y-2">
            {data.workExperience.map((w) => (
              <ResumeItem
                key={w.id}
                title={w.title}
                subtitle={[w.organization, w.location].filter(Boolean).join(' · ')}
                meta={formatDateRange(w.start_date, w.end_date, w.is_current) ?? undefined}
                body={w.description}
                onDelete={() => remove.mutate({ type: 'experience', id: w.id })}
                deleting={remove.isPending}
              />
            ))}
          </div>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Job title" value={expForm.title} onChange={(v) => setExpForm((f) => ({ ...f, title: v }))} required className="sm:col-span-2" />
          <Field label="Organization" value={expForm.organization} onChange={(v) => setExpForm((f) => ({ ...f, organization: v }))} />
          <Field label="Location" value={expForm.location} onChange={(v) => setExpForm((f) => ({ ...f, location: v }))} />
          <Field label="Start date" type="date" value={expForm.startDate} onChange={(v) => setExpForm((f) => ({ ...f, startDate: v }))} />
          <Field label="End date" type="date" value={expForm.endDate} onChange={(v) => setExpForm((f) => ({ ...f, endDate: v }))} disabled={expForm.isCurrent} />
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              checked={expForm.isCurrent}
              onChange={(e) => setExpForm((f) => ({ ...f, isCurrent: e.target.checked }))}
            />
            I currently work here
          </label>
          <div className="sm:col-span-2">
            <Label>Description</Label>
            <Textarea
              rows={3}
              placeholder="Key duties and achievements..."
              value={expForm.description}
              onChange={(e) => setExpForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
        </div>
        <AddButton
          label="Add experience"
          disabled={!expForm.title || addExperience.isPending}
          loading={addExperience.isPending}
          onClick={() => addExperience.mutate()}
        />
      </ResumeSection>

      <ResumeSection icon={GraduationCap} title="Education" description="Degrees and training.">
        {!!data.education?.length && (
          <div className="mb-4 space-y-2">
            {data.education.map((e) => (
              <ResumeItem
                key={e.id}
                title={e.institution}
                subtitle={[e.degree, e.field_of_study].filter(Boolean).join(' · ')}
                meta={formatYearRange(e.start_year, e.end_year) || undefined}
                body={e.description}
                onDelete={() => remove.mutate({ type: 'education', id: e.id })}
                deleting={remove.isPending}
              />
            ))}
          </div>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Institution" value={eduForm.institution} onChange={(v) => setEduForm((f) => ({ ...f, institution: v }))} required className="sm:col-span-2" />
          <Field label="Degree" value={eduForm.degree} onChange={(v) => setEduForm((f) => ({ ...f, degree: v }))} />
          <Field label="Field of study" value={eduForm.fieldOfStudy} onChange={(v) => setEduForm((f) => ({ ...f, fieldOfStudy: v }))} />
          <Field label="Start year" type="number" value={eduForm.startYear} onChange={(v) => setEduForm((f) => ({ ...f, startYear: v }))} />
          <Field label="End year" type="number" value={eduForm.endYear} onChange={(v) => setEduForm((f) => ({ ...f, endYear: v }))} />
        </div>
        <AddButton
          label="Add education"
          disabled={!eduForm.institution || addEducation.isPending}
          loading={addEducation.isPending}
          onClick={() => addEducation.mutate()}
        />
      </ResumeSection>

      <ResumeSection icon={Award} title="Certifications" description="Credentials and certificates.">
        {!!data.certifications?.length && (
          <div className="mb-4 space-y-2">
            {data.certifications.map((c) => (
              <ResumeItem
                key={c.id}
                title={c.name}
                subtitle={c.issuing_body ?? undefined}
                meta={formatResumeDate(c.issue_date) ?? undefined}
                onDelete={() => remove.mutate({ type: 'certifications', id: c.id })}
                deleting={remove.isPending}
              />
            ))}
          </div>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Name" value={certForm.name} onChange={(v) => setCertForm((f) => ({ ...f, name: v }))} required className="sm:col-span-2" />
          <Field label="Issuing body" value={certForm.issuingBody} onChange={(v) => setCertForm((f) => ({ ...f, issuingBody: v }))} />
          <Field label="Issue date" type="date" value={certForm.issueDate} onChange={(v) => setCertForm((f) => ({ ...f, issueDate: v }))} />
        </div>
        <AddButton
          label="Add certification"
          disabled={!certForm.name || addCert.isPending}
          loading={addCert.isPending}
          onClick={() => addCert.mutate()}
        />
      </ResumeSection>

      <ResumeSection icon={Shield} title="Licenses" description="Professional licenses.">
        {!!data.licenses?.length && (
          <div className="mb-4 space-y-2">
            {data.licenses.map((l) => (
              <ResumeItem
                key={l.id}
                title={l.license_type}
                subtitle={[l.license_number, l.country].filter(Boolean).join(' · ')}
                meta={formatResumeDate(l.issue_date) ?? undefined}
                onDelete={() => remove.mutate({ type: 'licenses', id: l.id })}
                deleting={remove.isPending}
              />
            ))}
          </div>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="License type" value={licenseForm.licenseType} onChange={(v) => setLicenseForm((f) => ({ ...f, licenseType: v }))} required />
          <Field label="License number" value={licenseForm.licenseNumber} onChange={(v) => setLicenseForm((f) => ({ ...f, licenseNumber: v }))} />
          <Field label="Country" value={licenseForm.country} onChange={(v) => setLicenseForm((f) => ({ ...f, country: v }))} />
          <Field label="Issue date" type="date" value={licenseForm.issueDate} onChange={(v) => setLicenseForm((f) => ({ ...f, issueDate: v }))} />
        </div>
        <AddButton
          label="Add license"
          disabled={!licenseForm.licenseType || addLicense.isPending}
          loading={addLicense.isPending}
          onClick={() => addLicense.mutate()}
        />
      </ResumeSection>
    </div>
  );
}

function ResumeSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="dash-panel profile-section-card overflow-hidden">
      <CardHeader className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="dash-stat-icon dash-stat-icon-blue shrink-0">
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription className="mt-0.5">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">{children}</CardContent>
    </Card>
  );
}

function ResumeItem({
  title,
  subtitle,
  meta,
  body,
  onDelete,
  deleting,
}: {
  title: string;
  subtitle?: string;
  meta?: string;
  body?: string | null;
  onDelete: () => void;
  deleting?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-border/60 bg-muted/20 p-3">
      <div className="min-w-0">
        <p className="font-medium">{title}</p>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        {meta && <p className="mt-0.5 text-xs text-muted-foreground">{meta}</p>}
        {body && <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{body}</p>}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
        disabled={deleting}
        onClick={onDelete}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required,
  disabled,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label>{label}</Label>
      <Input
        type={type}
        value={value}
        required={required}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5"
      />
    </div>
  );
}

function AddButton({
  label,
  onClick,
  disabled,
  loading,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <Button type="button" size="sm" className="mt-3" disabled={disabled} onClick={onClick}>
      {loading && <Spinner />}
      {label}
    </Button>
  );
}
