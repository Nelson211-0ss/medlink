import { query } from '../database/pool';
import { MatchRow } from '../types/entities';
import { BaseRepository } from './base.repository';

export class MatchRepository extends BaseRepository<MatchRow> {
  protected table = 'matches';

  async upsert(data: {
    jobId: string;
    professionalId: string;
    score: number;
    reasons: string[];
  }): Promise<MatchRow> {
    const { rows } = await query<MatchRow>(
      `INSERT INTO matches (job_id, professional_id, match_score, reasons)
       VALUES ($1, $2, $3, $4::jsonb)
       ON CONFLICT (job_id, professional_id)
       DO UPDATE SET match_score = EXCLUDED.match_score, reasons = EXCLUDED.reasons, updated_at = now()
       RETURNING *`,
      [data.jobId, data.professionalId, data.score, JSON.stringify(data.reasons)],
    );
    return rows[0];
  }

  async listForProfessional(professionalId: string, limit = 20): Promise<MatchRow[]> {
    const { rows } = await query<MatchRow>(
      `SELECT * FROM matches WHERE professional_id = $1
       ORDER BY match_score DESC LIMIT $2`,
      [professionalId, limit],
    );
    return rows;
  }

  async setAction(
    id: string,
    side: 'org' | 'prof',
    action: 'liked' | 'passed',
  ): Promise<MatchRow | null> {
    const col = side === 'org' ? 'org_action' : 'prof_action';
    const { rows } = await query<MatchRow>(
      `UPDATE matches SET ${col} = $1,
        is_mutual = (CASE WHEN org_action = 'liked' AND prof_action = 'liked' THEN TRUE
                          WHEN $1 = 'liked' AND ${side === 'org' ? 'prof_action' : 'org_action'} = 'liked' THEN TRUE
                          ELSE is_mutual END),
        updated_at = now()
       WHERE id = $2 RETURNING *`,
      [action, id],
    );
    return rows[0] ?? null;
  }

  async countMatchesForOrganization(orgId: string): Promise<number> {
    const { rows } = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM matches m
       JOIN jobs j ON j.id = m.job_id WHERE j.organization_id = $1`,
      [orgId],
    );
    return Number(rows[0]?.count ?? 0);
  }
}
