import { PoolClient, QueryResultRow } from 'pg';
import { pool, query } from '../database/pool';

type Executor = Pick<PoolClient, 'query'> | { query: typeof pool.query };

/**
 * Generic repository providing common CRUD helpers over a table.
 * Concrete repositories extend this and add domain-specific queries.
 */
export abstract class BaseRepository<T extends QueryResultRow> {
  protected abstract table: string;

  protected get db() {
    return { query };
  }

  async findById(id: string): Promise<T | null> {
    const { rows } = await query<T>(`SELECT * FROM ${this.table} WHERE id = $1`, [id]);
    return rows[0] ?? null;
  }

  async findOne(where: Partial<Record<string, unknown>>): Promise<T | null> {
    const keys = Object.keys(where);
    const clause = keys.map((k, i) => `${k} = $${i + 1}`).join(' AND ');
    const { rows } = await query<T>(
      `SELECT * FROM ${this.table} WHERE ${clause} LIMIT 1`,
      Object.values(where),
    );
    return rows[0] ?? null;
  }

  async deleteById(id: string): Promise<boolean> {
    const res = await query(`DELETE FROM ${this.table} WHERE id = $1`, [id]);
    return (res.rowCount ?? 0) > 0;
  }

  /** Insert a row from a plain object. Returns the created row. */
  async insert(data: Record<string, unknown>, executor?: Executor): Promise<T> {
    const keys = Object.keys(data);
    const cols = keys.join(', ');
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const sql = `INSERT INTO ${this.table} (${cols}) VALUES (${placeholders}) RETURNING *`;
    const runner = executor ?? { query };
    const { rows } = await runner.query<T>(sql, Object.values(data) as never[]);
    return rows[0];
  }

  /** Update by id from a partial object. Returns the updated row or null. */
  async update(id: string, data: Record<string, unknown>): Promise<T | null> {
    const keys = Object.keys(data);
    if (keys.length === 0) return this.findById(id);
    const set = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    const sql = `UPDATE ${this.table} SET ${set} WHERE id = $${keys.length + 1} RETURNING *`;
    const { rows } = await query<T>(sql, [...Object.values(data), id]);
    return rows[0] ?? null;
  }
}
