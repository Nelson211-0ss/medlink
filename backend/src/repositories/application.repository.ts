import { query } from '../database/pool';
import { ApplicationRow } from '../types/entities';
import { BaseRepository } from './base.repository';

export interface ApplicationWithJob extends ApplicationRow {
  job_title: string;
  organization_name: string;
}

export interface ApplicationWithCandidate extends ApplicationRow {
  first_name: string;
  last_name: string;
  profession: string | null;
  avatar: string | null;
}

export class ApplicationRepository extends BaseRepository<ApplicationRow> {
  protected table = 'applications';

  findByJobAndProfessional(jobId: string, professionalId: string): Promise<ApplicationRow | null> {
    return this.findOne({ job_id: jobId, professional_id: professionalId });
  }

  async listForProfessional(professionalId: string): Promise<ApplicationWithJob[]> {
    const { rows } = await query<ApplicationWithJob>(
      `SELECT a.*, j.title AS job_title, o.organization_name
       FROM applications a
       JOIN jobs j ON j.id = a.job_id
       JOIN organizations o ON o.id = j.organization_id
       WHERE a.professional_id = $1
       ORDER BY a.created_at DESC`,
      [professionalId],
    );
    return rows;
  }

  async listForJob(jobId: string): Promise<ApplicationWithCandidate[]> {
    const { rows } = await query<ApplicationWithCandidate>(
      `SELECT a.*, u.first_name, u.last_name, u.avatar, p.profession
       FROM applications a
       JOIN healthcare_professionals p ON p.id = a.professional_id
       JOIN users u ON u.id = p.user_id
       WHERE a.job_id = $1
       ORDER BY a.match_score DESC NULLS LAST, a.created_at DESC`,
      [jobId],
    );
    return rows;
  }

  async pipelineForOrganization(orgId: string): Promise<Record<string, number>> {
    const { rows } = await query<{ stage: string; count: string }>(
      `SELECT a.stage, COUNT(*)::text AS count
       FROM applications a JOIN jobs j ON j.id = a.job_id
       WHERE j.organization_id = $1 GROUP BY a.stage`,
      [orgId],
    );
    return rows.reduce<Record<string, number>>((acc, r) => {
      acc[r.stage] = Number(r.count);
      return acc;
    }, {});
  }
}
