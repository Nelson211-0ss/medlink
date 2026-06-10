import {
  Award,
  Briefcase,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ProfessionalPhotoFrame } from '@/components/ProfessionalPhotoFrame';
import { formatDateRange, formatResumeDate, formatYearRange } from '@/lib/resume';
import { cn, formatCurrency, titleCase } from '@/lib/utils';
import type { ProfessionalResume } from '@/types/resume';

export function ProfessionalResumeView({ data }: { data: ProfessionalResume }) {
  const name = data.user
    ? `${data.user.firstName ?? ''} ${data.user.lastName ?? ''}`.trim()
    : 'Healthcare professional';

  const roleLine = [
    titleCase(data.profession ?? 'professional'),
    data.specialization,
  ]
    .filter(Boolean)
    .join(' · ');

  const location = [data.city, data.country].filter(Boolean).join(', ');
  const verified = data.verification_status === 'verified';

  const hasBodyContent =
    !!data.bio ||
    !!data.workExperience?.length ||
    !!data.education?.length ||
    !!data.certifications?.length ||
    !!data.licenses?.length;

  return (
    <div className="org-resume">
      <div className="org-resume-layout">
        <aside className="org-resume-sidebar">
          <div className="org-resume-profile-card">
            <div className="org-resume-profile-accent" aria-hidden />
            <div className="org-resume-photo-wrap">
              <ProfessionalPhotoFrame
                avatar={data.user?.avatar}
                profession={data.profession}
                professionalId={data.id}
                alt={name}
                firstName={data.user?.firstName}
                lastName={data.user?.lastName}
                size="sidebar"
              />
            </div>

            <div className="org-resume-profile-body">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="org-resume-name">{name}</h1>
                  {verified && (
                    <span className="org-resume-verified">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Verified
                    </span>
                  )}
                </div>
                {roleLine && <p className="org-resume-role">{roleLine}</p>}
              </div>

              <ul className="org-resume-details">
                {data.experience_years != null && data.experience_years > 0 && (
                  <li className="org-resume-detail">
                    <Briefcase className="h-4 w-4 shrink-0 opacity-80" />
                    <span>{data.experience_years} years experience</span>
                  </li>
                )}
                {location && (
                  <li className="org-resume-detail">
                    <MapPin className="h-4 w-4 shrink-0 opacity-80" />
                    <span>{location}</span>
                  </li>
                )}
                {data.availability && (
                  <li className="org-resume-detail">
                    <Clock className="h-4 w-4 shrink-0 opacity-80" />
                    <span>{titleCase(data.availability.replace(/_/g, ' '))}</span>
                  </li>
                )}
                {data.salary_expectation != null && (
                  <li className="org-resume-detail">
                    <span className="org-resume-detail-dot" aria-hidden />
                    <span>{formatCurrency(data.salary_expectation)} / year</span>
                  </li>
                )}
                {data.user?.email && (
                  <li className="org-resume-detail">
                    <Mail className="h-4 w-4 shrink-0 opacity-80" />
                    <a href={`mailto:${data.user.email}`} className="org-resume-detail-link truncate">
                      {data.user.email}
                    </a>
                  </li>
                )}
                {data.user?.phone && (
                  <li className="org-resume-detail">
                    <Phone className="h-4 w-4 shrink-0 opacity-80" />
                    <a href={`tel:${data.user.phone}`} className="org-resume-detail-link">
                      {data.user.phone}
                    </a>
                  </li>
                )}
              </ul>

              {!!data.skills?.length && (
                <div className="org-resume-skills-block">
                  <p className="org-resume-sidebar-label">Skills</p>
                  <p className="org-resume-skills-text">{data.skills.join(' · ')}</p>
                </div>
              )}

              {data.cv_url && (
                <a
                  href={data.cv_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    'org-resume-download',
                    !data.skills?.length && 'org-resume-download--section',
                  )}
                >
                  <Download className="h-4 w-4" />
                  Download CV
                </a>
              )}
            </div>
          </div>
        </aside>

        <main className="org-resume-main">
          {!hasBodyContent ? (
            <div className="org-resume-empty">
              <FileText className="h-10 w-10 text-muted-foreground/40" />
              <p className="mt-3 text-sm font-medium text-foreground">Resume in progress</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                This professional has shared their profile but hasn&apos;t added experience, education, or
                credentials yet.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {data.bio && (
                <ResumeSection title="Professional summary" icon={FileText}>
                  <p className="org-resume-summary">{data.bio}</p>
                </ResumeSection>
              )}

              {!!data.workExperience?.length && (
                <ResumeSection title="Work experience" icon={Briefcase}>
                  <ol className="org-resume-timeline">
                    {data.workExperience.map((job) => (
                      <li key={job.id} className="org-resume-timeline-item">
                        <span
                          className={cn(
                            'org-resume-timeline-dot',
                            job.is_current && 'org-resume-timeline-dot--current',
                          )}
                          aria-hidden
                        />
                        <div className="org-resume-timeline-card">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h3 className="font-semibold leading-snug">{job.title}</h3>
                              <p className="mt-0.5 text-sm text-muted-foreground">
                                {[job.organization, job.location].filter(Boolean).join(' · ')}
                              </p>
                            </div>
                            {formatDateRange(job.start_date, job.end_date, job.is_current) && (
                              <span className="org-resume-date-badge">
                                {formatDateRange(job.start_date, job.end_date, job.is_current)}
                              </span>
                            )}
                          </div>
                          {job.description && (
                            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                              {job.description}
                            </p>
                          )}
                          {job.is_current && (
                            <span className="org-resume-current-pill">Current role</span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                </ResumeSection>
              )}

              {!!data.education?.length && (
                <ResumeSection title="Education" icon={GraduationCap}>
                  <div className="space-y-3">
                    {data.education.map((edu) => (
                      <div key={edu.id} className="org-resume-edu-card">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold leading-snug">{edu.institution}</h3>
                            <p className="mt-0.5 text-sm text-muted-foreground">
                              {[edu.degree, edu.field_of_study].filter(Boolean).join(' · ')}
                            </p>
                          </div>
                          {formatYearRange(edu.start_year, edu.end_year) && (
                            <span className="org-resume-date-badge">
                              {formatYearRange(edu.start_year, edu.end_year)}
                            </span>
                          )}
                        </div>
                        {edu.description && (
                          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                            {edu.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </ResumeSection>
              )}

              {(!!data.certifications?.length || !!data.licenses?.length) && (
                <div className="grid gap-5 lg:grid-cols-2">
                  {!!data.certifications?.length && (
                    <ResumeSection title="Certifications" icon={Award} compact>
                      <div className="space-y-2.5">
                        {data.certifications.map((cert) => (
                          <div key={cert.id} className="org-resume-credential">
                            <p className="font-medium leading-snug">{cert.name}</p>
                            {cert.issuing_body && (
                              <p className="mt-0.5 text-sm text-muted-foreground">{cert.issuing_body}</p>
                            )}
                            {(cert.issue_date || cert.expiry_date) && (
                              <p className="mt-1 text-xs text-muted-foreground">
                                {cert.issue_date && `Issued ${formatResumeDate(cert.issue_date)}`}
                                {cert.issue_date && cert.expiry_date && ' · '}
                                {cert.expiry_date && `Expires ${formatResumeDate(cert.expiry_date)}`}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </ResumeSection>
                  )}

                  {!!data.licenses?.length && (
                    <ResumeSection title="Licenses" icon={ShieldCheck} compact>
                      <div className="space-y-2.5">
                        {data.licenses.map((license) => (
                          <div key={license.id} className="org-resume-credential">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-medium leading-snug">{license.license_type}</p>
                              {license.verification_status === 'verified' && (
                                <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                                  Verified
                                </Badge>
                              )}
                            </div>
                            <p className="mt-0.5 text-sm text-muted-foreground">
                              {[license.license_number, license.country].filter(Boolean).join(' · ')}
                            </p>
                            {(license.issue_date || license.expiry_date) && (
                              <p className="mt-1 text-xs text-muted-foreground">
                                {license.issue_date && `Issued ${formatResumeDate(license.issue_date)}`}
                                {license.issue_date && license.expiry_date && ' · '}
                                {license.expiry_date && `Expires ${formatResumeDate(license.expiry_date)}`}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </ResumeSection>
                  )}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function ResumeSection({
  title,
  icon: Icon,
  compact,
  children,
}: {
  title: string;
  icon: React.ElementType;
  compact?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className={cn('org-resume-section', compact && 'org-resume-section--compact')}>
      <header className="org-resume-section-header">
        <span className="org-resume-section-icon">
          <Icon className="h-4 w-4" />
        </span>
        <h2 className="org-resume-section-title">{title}</h2>
      </header>
      <div className="org-resume-section-body">{children}</div>
    </section>
  );
}
