import { query } from '../database/pool';
import { ProfessionalRow } from '../types/entities';
import { BaseRepository } from './base.repository';

export class ProfessionalRepository extends BaseRepository<ProfessionalRow> {
  protected table = 'healthcare_professionals';

  findByUserId(userId: string): Promise<ProfessionalRow | null> {
    return this.findOne({ user_id: userId });
  }

  async findAllForMatching(filters: {
    profession?: string;
    country?: string;
  }): Promise<ProfessionalRow[]> {
    const conditions: string[] = ['open_to_offers = TRUE'];
    const params: unknown[] = [];
    if (filters.profession) {
      params.push(filters.profession);
      conditions.push(`profession = $${params.length}`);
    }
    if (filters.country) {
      params.push(filters.country);
      conditions.push(`country = $${params.length}`);
    }
    const { rows } = await query<ProfessionalRow>(
      `SELECT * FROM healthcare_professionals WHERE ${conditions.join(' AND ')} LIMIT 500`,
      params,
    );
    return rows;
  }

  async updateCompletion(id: string, completion: number): Promise<void> {
    await query('UPDATE healthcare_professionals SET profile_completion = $1 WHERE id = $2', [
      completion,
      id,
    ]);
  }

  async countVerified(): Promise<number> {
    const { rows } = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM healthcare_professionals WHERE verification_status = 'verified'`,
    );
    return Number(rows[0]?.count ?? 0);
  }

  /** All discoverable professionals — visible to every organization on the platform. */
  async searchDiscoverable(opts: {
    q?: string;
    profession?: string;
    specialization?: string;
    country?: string;
    city?: string;
    availability?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    rows: Array<ProfessionalRow & { first_name: string; last_name: string; avatar: string | null }>;
    total: number;
  }> {
    const page = opts.page ?? 1;
    const limit = opts.limit ?? 20;
    const offset = (page - 1) * limit;
    const conditions = [
      `u.role = 'professional'`,
      `u.status NOT IN ('suspended', 'deactivated')`,
    ];
    const params: unknown[] = [];

    const addEq = (column: string, value?: string) => {
      if (!value) return;
      params.push(value);
      conditions.push(`${column} = $${params.length}`);
    };

    addEq('p.profession', opts.profession);
    addEq('p.specialization', opts.specialization);
    addEq('p.country', opts.country);
    addEq('p.city', opts.city);
    addEq('p.availability', opts.availability);

    if (opts.q?.trim()) {
      params.push(`%${opts.q.trim()}%`);
      const i = params.length;
      conditions.push(`(
        u.first_name ILIKE $${i} OR u.last_name ILIKE $${i} OR
        p.specialization ILIKE $${i} OR p.city ILIKE $${i} OR p.country ILIKE $${i} OR
        p.profession ILIKE $${i} OR
        EXISTS (SELECT 1 FROM unnest(COALESCE(p.skills, '{}')) s WHERE s ILIKE $${i})
      )`);
    }

    const where = conditions.join(' AND ');
    const baseFrom = `FROM healthcare_professionals p JOIN users u ON u.id = p.user_id WHERE ${where}`;

    const { rows: countRows } = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count ${baseFrom}`,
      params,
    );
    const total = Number(countRows[0]?.count ?? 0);

    params.push(limit, offset);
    const { rows } = await query<
      ProfessionalRow & { first_name: string; last_name: string; avatar: string | null }
    >(
      `SELECT p.*, u.first_name, u.last_name, u.avatar
       ${baseFrom}
       ORDER BY p.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );

    return { rows, total };
  }
}
