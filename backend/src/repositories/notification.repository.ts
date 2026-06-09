import { query } from '../database/pool';
import { NotificationRow } from '../types/entities';

export class NotificationRepository {
  async create(data: {
    userId: string;
    type: string;
    title: string;
    body?: string;
    data?: Record<string, unknown>;
  }): Promise<NotificationRow> {
    const { rows } = await query<NotificationRow>(
      `INSERT INTO notifications (user_id, type, title, body, data)
       VALUES ($1, $2, $3, $4, $5::jsonb) RETURNING *`,
      [data.userId, data.type, data.title, data.body ?? null, JSON.stringify(data.data ?? {})],
    );
    return rows[0];
  }

  async listForUser(userId: string, limit = 30): Promise<NotificationRow[]> {
    const { rows } = await query<NotificationRow>(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
      [userId, limit],
    );
    return rows;
  }

  async unreadCount(userId: string): Promise<number> {
    const { rows } = await query<{ count: string }>(
      'SELECT COUNT(*)::text AS count FROM notifications WHERE user_id = $1 AND is_read = FALSE',
      [userId],
    );
    return Number(rows[0]?.count ?? 0);
  }

  async markRead(id: string, userId: string): Promise<void> {
    await query('UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2', [
      id,
      userId,
    ]);
  }

  async markAllRead(userId: string): Promise<void> {
    await query('UPDATE notifications SET is_read = TRUE WHERE user_id = $1', [userId]);
  }
}
