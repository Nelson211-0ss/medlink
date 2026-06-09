import { query } from '../database/pool';
import { OrganizationRow } from '../types/entities';
import { BaseRepository } from './base.repository';

export class OrganizationRepository extends BaseRepository<OrganizationRow> {
  protected table = 'organizations';

  findByUserId(userId: string): Promise<OrganizationRow | null> {
    return this.findOne({ user_id: userId });
  }

  async count(): Promise<number> {
    const { rows } = await query<{ count: string }>(
      'SELECT COUNT(*)::text AS count FROM organizations',
    );
    return Number(rows[0]?.count ?? 0);
  }
}
