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
}
