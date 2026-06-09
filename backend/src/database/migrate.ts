import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { pool } from './pool';
import { logger } from '../config/logger';

/**
 * Minimal forward-only SQL migration runner.
 * Applies every *.sql file in ./migrations in lexical order, exactly once.
 */
const MIGRATIONS_DIR = join(__dirname, 'migrations');

const ensureTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
};

const applied = async (): Promise<Set<string>> => {
  const { rows } = await pool.query<{ name: string }>('SELECT name FROM _migrations');
  return new Set(rows.map((r) => r.name));
};

export const runMigrations = async (): Promise<void> => {
  await ensureTable();
  const done = await applied();
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    if (done.has(file)) continue;
    const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf8');
    logger.info({ file }, 'Applying migration');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      logger.error({ err, file }, 'Migration failed');
      throw err;
    } finally {
      client.release();
    }
  }
  logger.info('Migrations complete');
};

if (require.main === module) {
  runMigrations()
    .then(() => pool.end())
    .then(() => process.exit(0))
    .catch((err) => {
      logger.error({ err }, 'Migration runner crashed');
      process.exit(1);
    });
}
