import { Building2, Calendar, CheckCircle2, Globe, Mail, Phone, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DetailCell, StatusBadge, VerificationBadge } from '@/components/admin/admin-shared';
import { cn, titleCase } from '@/lib/utils';
import type { AdminOrganizationUser } from '@/types/admin';

export function OrganizationAccountCard({
  user,
  isSelf,
  onDelete,
  deleting,
}: {
  user: AdminOrganizationUser;
  isSelf: boolean;
  onDelete: () => void;
  deleting?: boolean;
}) {
  const contactName = `${user.firstName} ${user.lastName}`.trim();
  const location = [user.city, user.country].filter(Boolean).join(', ');
  const orgName = user.organizationName || 'Unnamed organization';

  return (
    <article className="admin-account-card">
      <div className="admin-account-layout admin-account-layout--org">
        <div className="admin-org-logo-wrap">
          {user.logo ? (
            <img src={user.logo} alt={orgName} className="admin-org-logo" />
          ) : (
            <div className="admin-org-logo admin-org-logo--fallback">
              <Building2 className="h-10 w-10 text-primary" />
            </div>
          )}
        </div>

        <div className="admin-account-body">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight">{orgName}</h2>
                <VerificationBadge status={user.verificationStatus} />
                <StatusBadge status={user.status} />
                {isSelf && <Badge variant="outline">You</Badge>}
              </div>
              {user.organizationType && (
                <p className="admin-account-subtitle">{titleCase(user.organizationType)}</p>
              )}
            </div>

            <div className="admin-card-actions">
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

          {user.description && (
            <p className="admin-account-desc">{user.description}</p>
          )}

          <div className="admin-detail-grid">
            <DetailCell label="Registration" value={user.registrationNumber} />
            <DetailCell label="Facility size" value={user.size ? titleCase(user.size) : null} />
            <DetailCell label="Location" value={location || null} />
            <DetailCell
              label="Primary contact"
              value={contactName || null}
            />
          </div>

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
            {user.website && (
              <a
                href={user.website.startsWith('http') ? user.website : `https://${user.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className={cn('admin-contact-item hover:text-primary')}
              >
                <Globe className="h-4 w-4 shrink-0 text-primary" />
                {user.website.replace(/^https?:\/\//, '')}
              </a>
            )}
            <span className="admin-contact-item">
              <Calendar className="h-4 w-4 shrink-0 text-primary" />
              Joined {new Date(user.createdAt).toLocaleDateString()}
            </span>
            {user.verificationStatus === 'verified' && (
              <span className="admin-contact-item text-emerald-600">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                Verified facility
              </span>
            )}
          </div>

        </div>
      </div>
    </article>
  );
}
