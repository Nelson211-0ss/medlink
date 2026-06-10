import { query } from '../database/pool';
import { UserRepository } from '../repositories/user.repository';
import { FileService } from './file.service';
import { ProfessionalRepository } from '../repositories/professional.repository';
import { OrganizationRepository } from '../repositories/organization.repository';
import { JobRepository } from '../repositories/job.repository';
import { AuditRepository } from '../repositories/audit.repository';
import { ROLES, USER_STATUS, VERIFICATION_STATUS } from '../utils/constants';
import { BadRequestError, ForbiddenError, NotFoundError } from '../utils/errors';

export class AdminService {
  constructor(
    private users: UserRepository,
    private professionals: ProfessionalRepository,
    private organizations: OrganizationRepository,
    private jobs: JobRepository,
    private audit: AuditRepository,
    private files: FileService,
  ) {}

  async stats() {
    const byRole = await this.users.countByRole();
    const [verifiedPros, orgCount, activeJobs, revenue, totalApplications] = await Promise.all([
      this.professionals.countVerified(),
      this.organizations.count(),
      this.jobs.countActive(),
      query<{ sum: string }>(
        `SELECT COALESCE(COUNT(*) * 0, 0)::text AS sum FROM subscriptions WHERE plan <> 'free'`,
      ),
      query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM applications`),
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
      totalApplications: Number(totalApplications.rows[0]?.count ?? 0),
      unverifiedProfessionals: Math.max((byRole.professional ?? 0) - verifiedPros, 0),
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
      throw new BadRequestError('Invalid status');
    }
    const updated = await this.users.update(userId, { status });
    if (!updated) throw new NotFoundError('User not found');
    await this.audit.log({ actorId: adminId, action: 'set_user_status', entityType: 'user', entityId: userId, metadata: { status } });
    return updated;
  }

  async listUsers(params: { page: number; limit: number; offset: number; role?: string; q?: string }) {
    const { rows, total } = await this.users.listForAdmin({
      role: params.role,
      q: params.q,
      limit: params.limit,
      offset: params.offset,
    });

    const users = await Promise.all(
      rows.map(async (row) => {
        const base = {
          id: row.id,
          firstName: row.first_name,
          lastName: row.last_name,
          email: row.email,
          phone: row.phone,
          role: row.role,
          status: row.status,
          emailVerified: row.email_verified,
          createdAt: row.created_at,
          avatar: await this.files.resolveUrl(row.avatar),
        };

        if (row.role === 'professional') {
          return {
            ...base,
            professionalId: row.professional_id,
            profession: row.profession,
            specialization: row.specialization,
            experienceYears: row.experience_years,
            city: row.pro_city,
            country: row.pro_country,
            skills: row.skills ?? [],
            availability: row.availability,
            salaryExpectation: row.salary_expectation,
            licenseNumber: row.license_number,
            verificationStatus: row.pro_verification,
            profileCompletion: row.profile_completion,
          };
        }

        if (row.role === 'organization') {
          return {
            ...base,
            organizationId: row.organization_id,
            organizationName: row.organization_name,
            organizationType: row.organization_type,
            registrationNumber: row.registration_number,
            website: row.website,
            city: row.org_city,
            country: row.org_country,
            size: row.org_size,
            description: row.org_description,
            verificationStatus: row.org_verification,
            logo: await this.files.resolveUrl(row.logo),
          };
        }

        return base;
      }),
    );

    return { total, users };
  }

  async deleteUser(adminId: string, userId: string) {
    if (adminId === userId) {
      throw new ForbiddenError('You cannot delete your own account');
    }

    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundError('User not found');

    if (user.role === ROLES.ADMIN) {
      const adminCount = await this.users.countAdmins();
      if (adminCount <= 1) {
        throw new ForbiddenError('Cannot delete the last system administrator');
      }
    }

    const deleted = await this.users.deleteById(userId);
    if (!deleted) throw new NotFoundError('User not found');

    await this.audit.log({
      actorId: adminId,
      action: 'delete_user',
      entityType: 'user',
      entityId: userId,
      metadata: { email: user.email, role: user.role },
    });

    return { id: userId };
  }

  recentAuditLogs() {
    return this.audit.recent();
  }
}
