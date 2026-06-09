import { query } from '../database/pool';
import { UserRow } from '../types/entities';
import { BaseRepository } from './base.repository';

export class UserRepository extends BaseRepository<UserRow> {
  protected table = 'users';

  findByEmail(email: string): Promise<UserRow | null> {
    return this.findOne({ email });
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
