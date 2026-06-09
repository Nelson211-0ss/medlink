import { query } from '../database/pool';
import { UserRepository } from '../repositories/user.repository';
import { ProfessionalRepository } from '../repositories/professional.repository';
import { OrganizationRepository } from '../repositories/organization.repository';
import { JobRepository } from '../repositories/job.repository';
import { AuditRepository } from '../repositories/audit.repository';
import { VERIFICATION_STATUS, USER_STATUS } from '../utils/constants';
import { NotFoundError } from '../utils/errors';

export class AdminService {
  constructor(
    private users: UserRepository,
    private professionals: ProfessionalRepository,
    private organizations: OrganizationRepository,
    private jobs: JobRepository,
    private audit: AuditRepository,
  ) {}

  async stats() {
    const byRole = await this.users.countByRole();
    const [verifiedPros, orgCount, activeJobs, revenue] = await Promise.all([
      this.professionals.countVerified(),
      this.organizations.count(),
      this.jobs.countActive(),
      query<{ sum: string }>(
        `SELECT COALESCE(COUNT(*) * 0, 0)::text AS sum FROM subscriptions WHERE plan <> 'free'`,
      ),
    ]);
    const totalUsers = Object.values(byRole).reduce((a, b) => a + b, 0);
    const { rows: paidRows } = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM subscriptions WHERE plan <> 'free' AND status = 'active'`,
    );
    const paid = Number(paidRows[0]?.count ?? 0);
    return {
      totalUsers,
      totalProfessionals: byRole.professional ?? 0,
      totalOrganizations: orgCount,
      verifiedProfessionals: verifiedPros,
      activeJobs,
      paidSubscriptions: paid,
      estimatedMRR: paid * 19, // simplified
      _revenuePlaceholder: revenue.rows[0]?.sum,
    };
  }

  async listPendingVerifications() {
    const [pros, orgs, licenses] = await Promise.all([
      query(
        `SELECT p.id, p.profession, p.license_number, u.first_name, u.last_name, u.email
         FROM healthcare_professionals p JOIN users u ON u.id = p.user_id
         WHERE p.verification_status IN ('unverified','pending') LIMIT 100`,
      ),
      query(
        `SELECT o.id, o.organization_name, o.registration_number, u.email
         FROM organizations o JOIN users u ON u.id = o.user_id
         WHERE o.verification_status IN ('unverified','pending') LIMIT 100`,
      ),
      query(
        `SELECT l.*, u.first_name, u.last_name FROM licenses l
         JOIN healthcare_professionals p ON p.id = l.professional_id
         JOIN users u ON u.id = p.user_id
         WHERE l.verification_status = 'pending' LIMIT 100`,
      ),
    ]);
    return { professionals: pros.rows, organizations: orgs.rows, licenses: licenses.rows };
  }

  async verifyProfessional(adminId: string, professionalId: string, approve: boolean) {
    const status = approve ? VERIFICATION_STATUS.VERIFIED : VERIFICATION_STATUS.REJECTED;
    const updated = await this.professionals.update(professionalId, { verification_status: status });
    if (!updated) throw new NotFoundError('Professional not found');
    await this.audit.log({ actorId: adminId, action: 'verify_professional', entityType: 'professional', entityId: professionalId, metadata: { status } });
    return updated;
  }

  async verifyOrganization(adminId: string, organizationId: string, approve: boolean) {
    const status = approve ? VERIFICATION_STATUS.VERIFIED : VERIFICATION_STATUS.REJECTED;
    const updated = await this.organizations.update(organizationId, { verification_status: status });
    if (!updated) throw new NotFoundError('Organization not found');
    await this.audit.log({ actorId: adminId, action: 'verify_organization', entityType: 'organization', entityId: organizationId, metadata: { status } });
    return updated;
  }

  async verifyLicense(adminId: string, licenseId: string, approve: boolean) {
    const status = approve ? VERIFICATION_STATUS.VERIFIED : VERIFICATION_STATUS.REJECTED;
    const { rows } = await query(
      `UPDATE licenses SET verification_status = $1, verified_by = $2, verified_at = now()
       WHERE id = $3 RETURNING *`,
      [status, adminId, licenseId],
    );
    if (!rows[0]) throw new NotFoundError('License not found');
    await this.audit.log({ actorId: adminId, action: 'verify_license', entityType: 'license', entityId: licenseId, metadata: { status } });
    return rows[0];
  }

  async setUserStatus(adminId: string, userId: string, status: string) {
    if (!Object.values(USER_STATUS).includes(status as never)) {
      throw new NotFoundError('Invalid status');
    }
    const updated = await this.users.update(userId, { status });
    await this.audit.log({ actorId: adminId, action: 'set_user_status', entityType: 'user', entityId: userId, metadata: { status } });
    return updated;
  }

  recentAuditLogs() {
    return this.audit.recent();
  }
}
