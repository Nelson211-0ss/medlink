import { UserRepository } from '../repositories/user.repository';
import { TokenRepository } from '../repositories/token.repository';
import { ProfessionalRepository } from '../repositories/professional.repository';
import { OrganizationRepository } from '../repositories/organization.repository';
import { SubscriptionRepository } from '../repositories/subscription.repository';
import { EmailService } from './email.service';
import { withTransaction } from '../database/pool';
import {
  hashPassword,
  verifyPassword,
  generateToken,
  hashToken,
} from '../utils/password';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { BadRequestError, ConflictError, UnauthorizedError } from '../utils/errors';
import { ROLES, Role, USER_STATUS, SUBSCRIPTION_PLANS } from '../utils/constants';
import { UserRow } from '../types/entities';

interface RegisterInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
  role: Role;
  organizationName?: string;
  organizationType?: string;
  profession?: string;
}

const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export class AuthService {
  constructor(
    private users: UserRepository,
    private tokens: TokenRepository,
    private professionals: ProfessionalRepository,
    private organizations: OrganizationRepository,
    private subscriptions: SubscriptionRepository,
    private email: EmailService,
  ) {}

  private publicUser(u: UserRow) {
    return {
      id: u.id,
      firstName: u.first_name,
      lastName: u.last_name,
      email: u.email,
      role: u.role,
      avatar: u.avatar,
      status: u.status,
      emailVerified: u.email_verified,
    };
  }

  async register(input: RegisterInput, meta?: { userAgent?: string; ip?: string }) {
    const existing = await this.users.findByEmail(input.email);
    if (existing) throw new ConflictError('An account with this email already exists');

    if (input.role === ROLES.ORGANIZATION && !input.organizationName) {
      throw new BadRequestError('organizationName is required for organization accounts');
    }

    const passwordHash = await hashPassword(input.password);

    const user = await withTransaction(async (client) => {
      const { rows } = await client.query<UserRow>(
        `INSERT INTO users (first_name, last_name, email, phone, password_hash, role, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [
          input.firstName,
          input.lastName,
          input.email,
          input.phone ?? null,
          passwordHash,
          input.role,
          USER_STATUS.PENDING,
        ],
      );
      const created = rows[0];

      if (input.role === ROLES.PROFESSIONAL) {
        await client.query(
          `INSERT INTO healthcare_professionals (user_id, profession) VALUES ($1, $2)`,
          [created.id, input.profession ?? null],
        );
      } else if (input.role === ROLES.ORGANIZATION) {
        await client.query(
          `INSERT INTO organizations (user_id, organization_name, organization_type) VALUES ($1, $2, $3)`,
          [created.id, input.organizationName, input.organizationType ?? null],
        );
      }

      await client.query(
        `INSERT INTO subscriptions (user_id, plan, status) VALUES ($1, $2, 'active')`,
        [created.id, SUBSCRIPTION_PLANS.FREE],
      );
      return created;
    });

    // Email verification
    const { token, hash } = generateToken();
    await this.tokens.storeAuthToken({
      userId: user.id,
      tokenHash: hash,
      purpose: 'email_verify',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    await this.email.sendVerification(user.email, user.first_name, token);

    const tokens = await this.issueTokens(user, meta);
    return { user: this.publicUser(user), ...tokens };
  }

  async login(email: string, password: string, meta?: { userAgent?: string; ip?: string }) {
    const user = await this.users.findByEmail(email);
    if (!user) throw new UnauthorizedError('Invalid email or password');
    if (user.status === USER_STATUS.SUSPENDED) {
      throw new UnauthorizedError('Account suspended. Contact support.');
    }
    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) throw new UnauthorizedError('Invalid email or password');

    const tokens = await this.issueTokens(user, meta);
    return { user: this.publicUser(user), ...tokens };
  }

  private async issueTokens(user: UserRow, meta?: { userAgent?: string; ip?: string }) {
    const accessToken = signAccessToken({ id: user.id, email: user.email, role: user.role });
    const tokenId = generateToken().token;
    const refreshToken = signRefreshToken(user.id, tokenId);
    await this.tokens.storeRefreshToken({
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
      userAgent: meta?.userAgent,
      ip: meta?.ip,
    });
    return { accessToken, refreshToken };
  }

  async refresh(refreshToken: string, meta?: { userAgent?: string; ip?: string }) {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedError('Invalid refresh token');
    }
    const stored = await this.tokens.findValidRefreshToken(hashToken(refreshToken));
    if (!stored) throw new UnauthorizedError('Refresh token revoked or expired');

    const user = await this.users.findById(payload.sub);
    if (!user) throw new UnauthorizedError('User no longer exists');

    // Rotate: revoke old, issue new.
    await this.tokens.revokeRefreshToken(hashToken(refreshToken));
    const tokens = await this.issueTokens(user, meta);
    return { user: this.publicUser(user), ...tokens };
  }

  async logout(refreshToken?: string) {
    if (refreshToken) await this.tokens.revokeRefreshToken(hashToken(refreshToken));
  }

  async verifyEmail(token: string) {
    const userId = await this.tokens.consumeAuthToken(hashToken(token), 'email_verify');
    if (!userId) throw new BadRequestError('Invalid or expired verification token');
    await this.users.markEmailVerified(userId);
    return { verified: true };
  }

  async forgotPassword(email: string) {
    const user = await this.users.findByEmail(email);
    // Always return success to avoid user enumeration.
    if (!user) return { sent: true };
    const { token, hash } = generateToken();
    await this.tokens.storeAuthToken({
      userId: user.id,
      tokenHash: hash,
      purpose: 'password_reset',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });
    await this.email.sendPasswordReset(user.email, user.first_name, token);
    return { sent: true };
  }

  async resetPassword(token: string, newPassword: string) {
    const userId = await this.tokens.consumeAuthToken(hashToken(token), 'password_reset');
    if (!userId) throw new BadRequestError('Invalid or expired reset token');
    await this.users.setPassword(userId, await hashPassword(newPassword));
    await this.tokens.revokeAllForUser(userId);
    return { reset: true };
  }

  async me(userId: string) {
    const user = await this.users.findById(userId);
    if (!user) throw new UnauthorizedError();
    return this.publicUser(user);
  }
}
