import { query } from '../database/pool';
import { logger } from '../config/logger';

/**
 * Lightweight scheduled jobs. For heavy/queued workloads, swap to BullMQ
 * (already a dependency) with Redis-backed queues.
 */
const HOUR = 60 * 60 * 1000;

const closeExpiredJobs = async () => {
  const res = await query(
    `UPDATE jobs SET status = 'closed'
     WHERE status = 'open' AND expires_at IS NOT NULL AND expires_at < now()`,
  );
  if (res.rowCount) logger.info({ count: res.rowCount }, 'Closed expired jobs');
};

const purgeExpiredTokens = async () => {
  await query('DELETE FROM refresh_tokens WHERE expires_at < now()');
  await query('DELETE FROM auth_tokens WHERE expires_at < now()');
};

export const startJobs = (): NodeJS.Timeout[] => {
  const timers: NodeJS.Timeout[] = [];
  const run = async () => {
    try {
      await closeExpiredJobs();
      await purgeExpiredTokens();
    } catch (err) {
      logger.error({ err }, 'Scheduled job failed');
    }
  };
  // Run shortly after boot, then hourly.
  setTimeout(run, 30_000);
  timers.push(setInterval(run, HOUR));
  return timers;
};
