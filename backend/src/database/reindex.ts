import { pool, query } from './pool';
import { ensureIndices } from '../config/elasticsearch';
import { container } from '../container';
import { logger } from '../config/logger';
import { JobRow, ProfessionalRow } from '../types/entities';

/** Rebuild Elasticsearch indices from the Postgres source of truth. */
const reindex = async () => {
  await ensureIndices();
  const { searchService } = container.services;

  const pros = await query<ProfessionalRow & { first_name: string; last_name: string }>(
    `SELECT p.*, u.first_name, u.last_name FROM healthcare_professionals p
     JOIN users u ON u.id = p.user_id`,
  );
  for (const p of pros.rows) {
    await searchService.indexProfessional(p, `${p.first_name} ${p.last_name}`);
  }
  logger.info({ count: pros.rowCount }, 'Indexed professionals');

  const jobs = await query<JobRow & { organization_name: string }>(
    `SELECT j.*, o.organization_name FROM jobs j
     JOIN organizations o ON o.id = j.organization_id`,
  );
  for (const j of jobs.rows) {
    await searchService.indexJob(j, j.organization_name);
  }
  logger.info({ count: jobs.rowCount }, 'Indexed jobs');
};

reindex()
  .then(() => pool.end())
  .then(() => process.exit(0))
  .catch((err) => {
    logger.error({ err }, 'Reindex failed');
    process.exit(1);
  });
