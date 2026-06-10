import { query } from '../database/pool';
import { UserRow } from '../types/entities';
import { BaseRepository } from './base.repository';

export interface AdminUserListRow {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  role: string;
  status: string;
  email_verified: boolean;
  created_at: Date;
  professional_id: string | null;
  profession: string | null;
  specialization: string | null;
  experience_years: number | null;
  pro_city: string | null;
  pro_country: string | null;
  skills: string[] | null;
  availability: string | null;
  salary_expectation: number | null;
  license_number: string | null;
  pro_verification: string | null;
  profile_completion: number | null;
  organization_id: string | null;
  organization_name: string | null;
  organization_type: string | null;
  registration_number: string | null;
  website: string | null;
  org_city: string | null;
  org_country: string | null;
  org_size: string | null;
  org_description: string | null;
  org_verification: string | null;
  logo: string | null;
}

export class UserRepository extends BaseRepository<UserRow> {
  protected table = 'users';

  findByEmail(email: string): Promise<UserRow | null> {
    return this.findOne({ email });
  }

  findByOAuth(provider: string, subject: string): Promise<UserRow | null> {
    return this.findOne({ oauth_provider: provider, oauth_subject: subject });
  }

  async setPassword(userId: string, passwordHash: string): Promise<void> {
    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, userId]);
  }

  async markEmailVerified(userId: string): Promise<void> {
    await query(
      `UPDATE users SET email_verified = TRUE, status = 'active' WHERE id = $1`,
      [userId],
    );
  }

  async updateAvatar(userId: string, objectName: string): Promise<void> {
    await query('UPDATE users SET avatar = $1, updated_at = now() WHERE id = $2', [objectName, userId]);
  }

  async updateContact(
    userId: string,
    data: { phone?: string | null; contact_email?: string | null },
  ): Promise<void> {
    const sets: string[] = [];
    const params: unknown[] = [];
    if (data.phone !== undefined) {
      params.push(data.phone);
      sets.push(`phone = $${params.length}`);
    }
    if (data.contact_email !== undefined) {
      params.push(data.contact_email);
      sets.push(`contact_email = $${params.length}`);
    }
    if (!sets.length) return;
    params.push(userId);
    await query(`UPDATE users SET ${sets.join(', ')}, updated_at = now() WHERE id = $${params.length}`, params);
  }

  async countAdmins(): Promise<number> {
    const { rows } = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM users WHERE role = 'admin'`,
    );
    return Number(rows[0]?.count ?? 0);
  }

  async listForAdmin(opts: {
    role?: string;
    q?: string;
    limit: number;
    offset: number;
  }): Promise<{ rows: AdminUserListRow[]; total: number }> {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (opts.role) {
      params.push(opts.role);
      conditions.push(`u.role = $${params.length}`);
    }

    if (opts.q) {
      params.push(`%${opts.q}%`);
      const idx = params.length;
      conditions.push(
        `(u.email ILIKE $${idx} OR u.first_name ILIKE $${idx} OR u.last_name ILIKE $${idx}
          OR CONCAT(u.first_name, ' ', u.last_name) ILIKE $${idx}
          OR p.profession ILIKE $${idx} OR p.specialization ILIKE $${idx}
          OR o.organization_name ILIKE $${idx})`,
      );
    }

    const joins = `
      LEFT JOIN healthcare_professionals p ON p.user_id = u.id
      LEFT JOIN organizations o ON o.user_id = u.id`;
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const { rows: countRows } = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM users u ${joins} ${where}`,
      params,
    );
    const total = Number(countRows[0]?.count ?? 0);

    params.push(opts.limit, opts.offset);
    const { rows } = await query<AdminUserListRow>(
      `SELECT
         u.id,
         u.first_name,
         u.last_name,
         u.email,
         u.phone,
         u.avatar,
         u.role,
         u.status,
         u.email_verified,
         u.created_at,
         p.id AS professional_id,
         p.profession,
         p.specialization,
         p.experience_years,
         p.city AS pro_city,
         p.country AS pro_country,
         p.skills,
         p.availability,
         p.salary_expectation,
         p.license_number,
         p.verification_status AS pro_verification,
         p.profile_completion,
         o.id AS organization_id,
         o.organization_name,
         o.organization_type,
         o.registration_number,
         o.website,
         o.city AS org_city,
         o.country AS org_country,
         o.size AS org_size,
         o.description AS org_description,
         o.verification_status AS org_verification,
         o.logo
       FROM users u
       ${joins}
       ${where}
       ORDER BY u.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );

    return { rows, total };
  }

  async countByRole(): Promise<Record<string, number>> {
    const { rows } = await query<{ role: string; count: string }>(
      'SELECT role, COUNT(*)::text AS count FROM users GROUP BY role',
    );
    return rows.reduce<Record<string, number>>((acc, r) => {
      acc[r.role] = Number(r.count);
      return acc;
    }, {});
  }
}
