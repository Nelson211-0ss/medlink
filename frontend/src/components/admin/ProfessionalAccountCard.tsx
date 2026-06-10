import { Link } from 'react-router-dom';
import { Calendar, CheckCircle2, ExternalLink, Mail, Phone, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ProfessionalPhotoFrame } from '@/components/ProfessionalPhotoFrame';
import { DetailCell, StatusBadge, VerificationBadge } from '@/components/admin/admin-shared';
import { formatCurrency, titleCase } from '@/lib/utils';
import type { AdminProfessionalUser } from '@/types/admin';

export function ProfessionalAccountCard({
  user,
  isSelf,
  onDelete,
  deleting,
}: {
  user: AdminProfessionalUser;
  isSelf: boolean;
  onDelete: () => void;
  deleting?: boolean;
}) {
  const name = `${user.firstName} ${user.lastName}`.trim() || 'Unnamed professional';
  const location = [user.city, user.country].filter(Boolean).join(', ');
  const roleLine = [titleCase(user.profession ?? ''), user.specialization].filter(Boolean).join(' · ');

  return (
    <article className="admin-account-card">
      <div className="admin-account-layout">
        <div className="admin-account-photo">
          <ProfessionalPhotoFrame
            avatar={user.avatar}
            profession={user.profession}
            professionalId={user.professionalId ?? user.id}
            alt={name}
            firstName={user.firstName}
            lastName={user.lastName}
            size="lg"
            className="admin-account-photo-frame"
          />
        </div>

        <div className="admin-account-body">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight">{name}</h2>
                <VerificationBadge status={user.verificationStatus} />
                <StatusBadge status={user.status} />
                {isSelf && <Badge variant="outline">You</Badge>}
              </div>
              {roleLine && <p className="admin-account-subtitle">{roleLine}</p>}
            </div>

            <div className="admin-card-actions">
              {user.professionalId && (
                <Button size="sm" variant="secondary" className="admin-card-action" asChild>
                  <Link to={`/candidates/${user.professionalId}`}>
                    <ExternalLink className="h-4 w-4" />
                    Profile
                  </Link>
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                className="admin-card-action admin-card-action--danger"
                disabled={isSelf || deleting}
                onClick={onDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="admin-detail-grid">
            <DetailCell label="Experience" value={user.experienceYears != null ? `${user.experienceYears} years` : null} />
            <DetailCell label="Location" value={location || null} />
            <DetailCell
              label="Availability"
              value={user.availability ? titleCase(user.availability.replace(/_/g, ' ')) : null}
            />
            <DetailCell
              label="Salary expectation"
              value={user.salaryExpectation != null ? `${formatCurrency(user.salaryExpectation)} / yr` : null}
            />
            <DetailCell label="License" value={user.licenseNumber} />
            <DetailCell
              label="Profile completion"
              value={user.profileCompletion != null ? `${user.profileCompletion}%` : null}
            />
          </div>

          {!!user.skills?.length && (
            <div className="space-y-2">
              <p className="admin-detail-label">Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {user.skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="admin-skill-badge">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="admin-contact-row">
            <span className="admin-contact-item">
              <Mail className="h-4 w-4 shrink-0 text-primary" />
              <a href={`mailto:${user.email}`} className="truncate hover:underline">
                {user.email}
              </a>
              {!user.emailVerified && <span className="text-amber-600">· Unverified</span>}
            </span>
            {user.phone && (
              <span className="admin-contact-item">
                <Phone className="h-4 w-4 shrink-0 text-primary" />
                <a href={`tel:${user.phone}`} className="hover:underline">
                  {user.phone}
                </a>
              </span>
            )}
            <span className="admin-contact-item">
              <Calendar className="h-4 w-4 shrink-0 text-primary" />
              Joined {new Date(user.createdAt).toLocaleDateString()}
            </span>
            {user.verificationStatus === 'verified' && (
              <span className="admin-contact-item text-emerald-600">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                Verified professional
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
