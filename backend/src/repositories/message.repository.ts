import { query, withTransaction } from '../database/pool';
import { MessageRow } from '../types/entities';

export class MessageRepository {
  /** Find or create a 1:1 conversation between two users. */
  async getOrCreateConversation(userA: string, userB: string): Promise<string> {
    const existing = await query<{ id: string }>(
      `SELECT c.id FROM conversations c
       JOIN conversation_participants p1 ON p1.conversation_id = c.id AND p1.user_id = $1
       JOIN conversation_participants p2 ON p2.conversation_id = c.id AND p2.user_id = $2
       LIMIT 1`,
      [userA, userB],
    );
    if (existing.rows[0]) return existing.rows[0].id;

    return withTransaction(async (client) => {
      const conv = await client.query<{ id: string }>(
        'INSERT INTO conversations DEFAULT VALUES RETURNING id',
      );
      const id = conv.rows[0].id;
      await client.query(
        `INSERT INTO conversation_participants (conversation_id, user_id) VALUES ($1, $2), ($1, $3)`,
        [id, userA, userB],
      );
      return id;
    });
  }

  async listConversations(userId: string) {
    const { rows } = await query(
      `SELECT c.id,
              other.user_id AS other_user_id,
              u.first_name, u.last_name, u.avatar, u.role,
              lm.body AS last_message, lm.created_at AS last_message_at,
              (SELECT COUNT(*) FROM messages m
                 WHERE m.conversation_id = c.id AND m.sender_id <> $1 AND m.read_at IS NULL
              )::int AS unread_count
       FROM conversations c
       JOIN conversation_participants me ON me.conversation_id = c.id AND me.user_id = $1
       JOIN conversation_participants other ON other.conversation_id = c.id AND other.user_id <> $1
       JOIN users u ON u.id = other.user_id
       LEFT JOIN LATERAL (
         SELECT body, created_at FROM messages m
         WHERE m.conversation_id = c.id ORDER BY created_at DESC LIMIT 1
       ) lm ON TRUE
       ORDER BY lm.created_at DESC NULLS LAST`,
      [userId],
    );
    return rows;
  }

  async isParticipant(conversationId: string, userId: string): Promise<boolean> {
    const { rows } = await query(
      'SELECT 1 FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2',
      [conversationId, userId],
    );
    return rows.length > 0;
  }

  async createMessage(data: {
    conversationId: string;
    senderId: string;
    body?: string;
    attachmentUrl?: string;
  }): Promise<MessageRow> {
    const { rows } = await query<MessageRow>(
      `INSERT INTO messages (conversation_id, sender_id, body, attachment_url)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [data.conversationId, data.senderId, data.body ?? null, data.attachmentUrl ?? null],
    );
    await query('UPDATE conversations SET updated_at = now() WHERE id = $1', [data.conversationId]);
    return rows[0];
  }

  async listMessages(conversationId: string, limit = 50, before?: string): Promise<MessageRow[]> {
    const params: unknown[] = [conversationId];
    let cursor = '';
    if (before) {
      params.push(before);
      cursor = `AND created_at < (SELECT created_at FROM messages WHERE id = $${params.length})`;
    }
    params.push(limit);
    const { rows } = await query<MessageRow>(
      `SELECT * FROM messages WHERE conversation_id = $1 ${cursor}
       ORDER BY created_at DESC LIMIT $${params.length}`,
      params,
    );
    return rows.reverse();
  }

  async markRead(conversationId: string, readerId: string): Promise<void> {
    await query(
      `UPDATE messages SET read_at = now()
       WHERE conversation_id = $1 AND sender_id <> $2 AND read_at IS NULL`,
      [conversationId, readerId],
    );
    await query(
      `UPDATE conversation_participants SET last_read_at = now()
       WHERE conversation_id = $1 AND user_id = $2`,
      [conversationId, readerId],
    );
  }
}
