import { query } from '../database/pool';

export class SavedRepository {
  async saveCandidate(orgId: string, professionalId: string, note?: string): Promise<void> {
    await query(
      `INSERT INTO saved_candidates (organization_id, professional_id, note)
       VALUES ($1, $2, $3)
       ON CONFLICT (organization_id, professional_id) DO UPDATE SET note = EXCLUDED.note`,
      [orgId, professionalId, note ?? null],
    );
  }

  async unsaveCandidate(orgId: string, professionalId: string): Promise<void> {
    await query(
      'DELETE FROM saved_candidates WHERE organization_id = $1 AND professional_id = $2',
      [orgId, professionalId],
    );
  }

  async listSavedCandidates(orgId: string) {
    const { rows } = await query(
      `SELECT sc.*, u.first_name, u.last_name, u.avatar, p.profession, p.specialization
       FROM saved_candidates sc
       JOIN healthcare_professionals p ON p.id = sc.professional_id
       JOIN users u ON u.id = p.user_id
       WHERE sc.organization_id = $1 ORDER BY sc.created_at DESC`,
      [orgId],
    );
    return rows;
  }

  async saveJob(professionalId: string, jobId: string): Promise<void> {
    await query(
      `INSERT INTO saved_jobs (professional_id, job_id) VALUES ($1, $2)
       ON CONFLICT (professional_id, job_id) DO NOTHING`,
      [professionalId, jobId],
    );
  }

  async unsaveJob(professionalId: string, jobId: string): Promise<void> {
    await query('DELETE FROM saved_jobs WHERE professional_id = $1 AND job_id = $2', [
      professionalId,
      jobId,
    ]);
  }

  async listSavedJobs(professionalId: string) {
    const { rows } = await query(
      `SELECT sj.created_at AS saved_at, j.*
       FROM saved_jobs sj JOIN jobs j ON j.id = sj.job_id
       WHERE sj.professional_id = $1 ORDER BY sj.created_at DESC`,
      [professionalId],
    );
    return rows;
  }
}
