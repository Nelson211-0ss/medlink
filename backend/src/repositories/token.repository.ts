import { query } from '../database/pool';

export interface RefreshTokenRow {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  revoked_at: Date | null;
}

export class TokenRepository {
  async storeRefreshToken(data: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    userAgent?: string;
    ip?: string;
  }): Promise<void> {
    await query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, user_agent, ip_address)
       VALUES ($1, $2, $3, $4, $5)`,
      [data.userId, data.tokenHash, data.expiresAt, data.userAgent ?? null, data.ip ?? null],
    );
  }

  async findValidRefreshToken(tokenHash: string): Promise<RefreshTokenRow | null> {
    const { rows } = await query<RefreshTokenRow>(
      `SELECT * FROM refresh_tokens
       WHERE token_hash = $1 AND revoked_at IS NULL AND expires_at > now() LIMIT 1`,
      [tokenHash],
    );
    return rows[0] ?? null;
  }

  async revokeRefreshToken(tokenHash: string): Promise<void> {
    await query('UPDATE refresh_tokens SET revoked_at = now() WHERE token_hash = $1', [tokenHash]);
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await query(
      'UPDATE refresh_tokens SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL',
      [userId],
    );
  }

  async storeAuthToken(data: {
    userId: string;
    tokenHash: string;
    purpose: 'email_verify' | 'password_reset';
    expiresAt: Date;
  }): Promise<void> {
    await query(
      `INSERT INTO auth_tokens (user_id, token_hash, purpose, expires_at)
       VALUES ($1, $2, $3, $4)`,
      [data.userId, data.tokenHash, data.purpose, data.expiresAt],
    );
  }

  async consumeAuthToken(
    tokenHash: string,
    purpose: 'email_verify' | 'password_reset',
  ): Promise<string | null> {
    const { rows } = await query<{ user_id: string }>(
      `UPDATE auth_tokens SET used_at = now()
       WHERE token_hash = $1 AND purpose = $2 AND used_at IS NULL AND expires_at > now()
       RETURNING user_id`,
      [tokenHash, purpose],
    );
    return rows[0]?.user_id ?? null;
  }
}
