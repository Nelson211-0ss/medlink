import { query } from '../database/pool';
import { JobRow } from '../types/entities';
import { BaseRepository } from './base.repository';
import { PaginationParams } from '../utils/pagination';

export class JobRepository extends BaseRepository<JobRow> {
  protected table = 'jobs';

  async listOpen(
    p: PaginationParams,
    filters: { profession?: string; country?: string; q?: string } = {},
  ): Promise<{ rows: JobRow[]; total: number }> {
    const conditions: string[] = [`status = 'open'`];
    const params: unknown[] = [];
    if (filters.profession) {
      params.push(filters.profession);
      conditions.push(`profession = $${params.length}`);
    }
    if (filters.country) {
      params.push(filters.country);
      conditions.push(`country = $${params.length}`);
    }
    if (filters.q) {
      params.push(`%${filters.q}%`);
      conditions.push(`(title ILIKE $${params.length} OR description ILIKE $${params.length})`);
    }
    const where = conditions.join(' AND ');

    const totalRes = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM jobs WHERE ${where}`,
      params,
    );
    const total = Number(totalRes.rows[0]?.count ?? 0);

    params.push(p.limit, p.offset);
    const { rows } = await query<JobRow>(
      `SELECT * FROM jobs WHERE ${where}
       ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    return { rows, total };
  }

  async listByOrganization(orgId: string): Promise<JobRow[]> {
    const { rows } = await query<JobRow>(
      'SELECT * FROM jobs WHERE organization_id = $1 ORDER BY created_at DESC',
      [orgId],
    );
    return rows;
  }

  async incrementViews(id: string): Promise<void> {
    await query('UPDATE jobs SET views_count = views_count + 1 WHERE id = $1', [id]);
  }

  async countActive(): Promise<number> {
    const { rows } = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM jobs WHERE status = 'open'`,
    );
    return Number(rows[0]?.count ?? 0);
  }
}
