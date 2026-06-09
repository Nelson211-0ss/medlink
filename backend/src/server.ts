import { createServer } from 'http';
import { createApp } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { initSockets } from './sockets';
import { startJobs } from './jobs';
import { ensureIndices } from './config/elasticsearch';
import { ensureBucket } from './config/storage';
import { checkDatabase, pool } from './database/pool';
import { runMigrations } from './database/migrate';

const bootstrap = async () => {
  const dbOk = await checkDatabase();
  if (!dbOk) {
    logger.error('Cannot connect to the database. Exiting.');
    process.exit(1);
  }

  // Apply pending migrations on boot (idempotent).
  try {
    await runMigrations();
  } catch (err) {
    logger.error({ err }, 'Migrations failed on boot');
  }

  // Best-effort infra provisioning (non-fatal if unavailable).
  await Promise.allSettled([ensureIndices(), ensureBucket()]);

  const app = createApp();
  const httpServer = createServer(app);
  initSockets(httpServer);
  const timers = startJobs();

  httpServer.listen(env.PORT, () => {
    logger.info(`🚀 MediNexus API listening on http://localhost:${env.PORT}${env.API_PREFIX}`);
    logger.info(`📚 API docs at http://localhost:${env.PORT}/docs`);
  });

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutting down...');
    timers.forEach(clearInterval);
    httpServer.close();
    await pool.end();
    process.exit(0);
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

bootstrap().catch((err) => {
  logger.error({ err }, 'Fatal bootstrap error');
  process.exit(1);
});
