import { query } from '../database/pool';

export class AuditRepository {
  async log(data: {
    actorId?: string | null;
    action: string;
    entityType?: string;
    entityId?: string;
    metadata?: Record<string, unknown>;
    ip?: string;
  }): Promise<void> {
    await query(
      `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata, ip_address)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6)`,
      [
        data.actorId ?? null,
        data.action,
        data.entityType ?? null,
        data.entityId ?? null,
        JSON.stringify(data.metadata ?? {}),
        data.ip ?? null,
      ],
    );
  }

  async recent(limit = 100) {
    const { rows } = await query(
      'SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT $1',
      [limit],
    );
    return rows;
  }
}
