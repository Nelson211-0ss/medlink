import { query } from '../database/pool';
import { JobRow } from '../types/entities';
import { BaseRepository } from './base.repository';
import { PaginationParams } from '../utils/pagination';

export type JobWithOrganization = JobRow & {
  organization_name: string;
  organization_type?: string | null;
};

type JobFilters = { profession?: string; country?: string; q?: string };

export class JobRepository extends BaseRepository<JobRow> {
  protected table = 'jobs';

  private buildFilterConditions(filters: JobFilters, alias = 'j') {
    const conditions: string[] = [];
    const params: unknown[] = [];
    if (filters.profession) {
      params.push(filters.profession);
      conditions.push(`${alias}.profession = $${params.length}`);
    }
    if (filters.country) {
      params.push(filters.country);
      conditions.push(`${alias}.country = $${params.length}`);
    }
    if (filters.q) {
      params.push(`%${filters.q}%`);
      conditions.push(
        `(${alias}.title ILIKE $${params.length} OR ${alias}.description ILIKE $${params.length})`,
      );
    }
    return { conditions, params };
  }

  async listOpen(
    p: PaginationParams,
    filters: JobFilters = {},
  ): Promise<{ rows: JobWithOrganization[]; total: number }> {
    const conditions: string[] = [
      `j.status = 'open'`,
      `(j.expires_at IS NULL OR j.expires_at > now())`,
    ];
    const { conditions: filterConditions, params } = this.buildFilterConditions(filters, 'j');
    conditions.push(...filterConditions);
    const where = conditions.join(' AND ');

    const totalRes = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM jobs j
       INNER JOIN organizations o ON o.id = j.organization_id
       WHERE ${where}`,
      params,
    );
    const total = Number(totalRes.rows[0]?.count ?? 0);

    params.push(p.limit, p.offset);
    const { rows } = await query<JobWithOrganization>(
      `SELECT j.*, o.organization_name, o.organization_type
       FROM jobs j
       INNER JOIN organizations o ON o.id = j.organization_id
       WHERE ${where}
       ORDER BY j.created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    return { rows, total };
  }

  async listByOrganization(
    orgId: string,
    filters: JobFilters = {},
  ): Promise<JobWithOrganization[]> {
    const conditions = ['j.organization_id = $1'];
    const params: unknown[] = [orgId];
    if (filters.profession) {
      params.push(filters.profession);
      conditions.push(`j.profession = $${params.length}`);
    }
    if (filters.country) {
      params.push(filters.country);
      conditions.push(`j.country = $${params.length}`);
    }
    if (filters.q) {
      params.push(`%${filters.q}%`);
      conditions.push(
        `(j.title ILIKE $${params.length} OR j.description ILIKE $${params.length})`,
      );
    }
    const where = conditions.join(' AND ');
    const { rows } = await query<JobWithOrganization>(
      `SELECT j.*, o.organization_name, o.organization_type
       FROM jobs j
       INNER JOIN organizations o ON o.id = j.organization_id
       WHERE ${where}
       ORDER BY j.created_at DESC`,
      params,
    );
    return rows;
  }

  async findByIdWithOrganization(id: string): Promise<JobWithOrganization | null> {
    const { rows } = await query<JobWithOrganization>(
      `SELECT j.*, o.organization_name, o.organization_type
       FROM jobs j
       INNER JOIN organizations o ON o.id = j.organization_id
       WHERE j.id = $1`,
      [id],
    );
    return rows[0] ?? null;
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
