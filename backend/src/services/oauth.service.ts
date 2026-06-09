import axios from 'axios';
import { randomBytes } from 'crypto';
import { env } from '../config/env';
import { AuthService } from './auth.service';

type OAuthProvider = 'google' | 'apple';
type OAuthMode = 'login' | 'signup';

interface OAuthProfile {
  provider: OAuthProvider;
  subject: string;
  email: string;
  firstName: string;
  lastName: string;
  emailVerified: boolean;
}

const pendingStates = new Map<string, { provider: OAuthProvider; mode: OAuthMode; expires: number }>();

function pruneStates() {
  const now = Date.now();
  for (const [key, value] of pendingStates) {
    if (value.expires < now) pendingStates.delete(key);
  }
}

function createState(provider: OAuthProvider, mode: OAuthMode) {
  pruneStates();
  const state = randomBytes(24).toString('hex');
  pendingStates.set(state, { provider, mode, expires: Date.now() + 10 * 60 * 1000 });
  return state;
}

function consumeState(state: string, provider: OAuthProvider) {
  const entry = pendingStates.get(state);
  pendingStates.delete(state);
  if (!entry || entry.provider !== provider || entry.expires < Date.now()) return null;
  return entry;
}

function callbackUrl(provider: OAuthProvider) {
  return `${env.APP_URL}${env.API_PREFIX}/auth/oauth/${provider}/callback`;
}

function frontendRedirect(error?: string) {
  const base = `${env.FRONTEND_URL}/oauth/callback`;
  return error ? `${base}?error=${error}` : `${base}?success=1`;
}

function isGoogleConfigured() {
  return !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
}

function isAppleConfigured() {
  return !!(env.APPLE_CLIENT_ID && env.APPLE_TEAM_ID && env.APPLE_KEY_ID && env.APPLE_PRIVATE_KEY);
}

export class OAuthService {
  constructor(private auth: AuthService) {}

  start(provider: OAuthProvider, mode: OAuthMode) {
    if (provider === 'google') return this.startGoogle(mode);
    return this.startApple(mode);
  }

  private startGoogle(mode: OAuthMode) {
    if (!isGoogleConfigured()) return frontendRedirect('oauth_unavailable');

    const state = createState('google', mode);
    const params = new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID!,
      redirect_uri: callbackUrl('google'),
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'online',
      prompt: 'select_account',
      state,
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  }

  private startApple(mode: OAuthMode) {
    if (!isAppleConfigured()) return frontendRedirect('oauth_unavailable');

    const state = createState('apple', mode);
    const params = new URLSearchParams({
      client_id: env.APPLE_CLIENT_ID!,
      redirect_uri: callbackUrl('apple'),
      response_type: 'code',
      scope: 'name email',
      response_mode: 'form_post',
      state,
    });

    return `https://appleid.apple.com/auth/authorize?${params}`;
  }

  async handleGoogleCallback(code: string, state: string, meta?: { userAgent?: string; ip?: string }) {
    const session = consumeState(state, 'google');
    if (!session) return { redirect: frontendRedirect('oauth_failed') };
    if (!isGoogleConfigured()) return { redirect: frontendRedirect('oauth_unavailable') };

    try {
      const tokenRes = await axios.post(
        'https://oauth2.googleapis.com/token',
        new URLSearchParams({
          code,
          client_id: env.GOOGLE_CLIENT_ID!,
          client_secret: env.GOOGLE_CLIENT_SECRET!,
          redirect_uri: callbackUrl('google'),
          grant_type: 'authorization_code',
        }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
      );

      const accessToken = tokenRes.data.access_token as string;
      const { data: profile } = await axios.get<{
        sub: string;
        email?: string;
        email_verified?: boolean;
        given_name?: string;
        family_name?: string;
        name?: string;
      }>('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!profile.email) return { redirect: frontendRedirect('oauth_failed') };

      const [fallbackFirst, ...rest] = (profile.name ?? profile.email.split('@')[0]).split(' ');
      const oauthProfile: OAuthProfile = {
        provider: 'google',
        subject: profile.sub,
        email: profile.email,
        firstName: profile.given_name ?? fallbackFirst ?? 'User',
        lastName: profile.family_name ?? rest.join(' ') ?? '',
        emailVerified: profile.email_verified ?? true,
      };

      const result = await this.auth.oauthLoginOrRegister(oauthProfile, meta);
      return { redirect: frontendRedirect(), tokens: result };
    } catch {
      return { redirect: frontendRedirect('oauth_failed') };
    }
  }

  async handleAppleCallback(
    code: string | undefined,
    state: string,
    userJson: string | undefined,
    meta?: { userAgent?: string; ip?: string },
  ) {
    const session = consumeState(state, 'apple');
    if (!session) return { redirect: frontendRedirect('oauth_failed') };
    if (!isAppleConfigured() || !code) return { redirect: frontendRedirect('oauth_unavailable') };

    try {
      const clientSecret = await this.buildAppleClientSecret();
      const tokenRes = await axios.post(
        'https://appleid.apple.com/auth/token',
        new URLSearchParams({
          client_id: env.APPLE_CLIENT_ID!,
          client_secret: clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: callbackUrl('apple'),
        }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
      );

      const idToken = tokenRes.data.id_token as string;
      const payload = JSON.parse(Buffer.from(idToken.split('.')[1], 'base64url').toString()) as {
        sub: string;
        email?: string;
        email_verified?: string | boolean;
      };

      let firstName = 'Apple';
      let lastName = 'User';
      if (userJson) {
        try {
          const parsed = JSON.parse(userJson) as { name?: { firstName?: string; lastName?: string } };
          firstName = parsed.name?.firstName ?? firstName;
          lastName = parsed.name?.lastName ?? lastName;
        } catch {
          /* ignore malformed user payload */
        }
      }

      if (!payload.email) return { redirect: frontendRedirect('oauth_failed') };

      const oauthProfile: OAuthProfile = {
        provider: 'apple',
        subject: payload.sub,
        email: payload.email,
        firstName,
        lastName,
        emailVerified: payload.email_verified === true || payload.email_verified === 'true',
      };

      const result = await this.auth.oauthLoginOrRegister(oauthProfile, meta);
      return { redirect: frontendRedirect(), tokens: result };
    } catch {
      return { redirect: frontendRedirect('oauth_failed') };
    }
  }

  private async buildAppleClientSecret() {
    const jwt = await import('jsonwebtoken');
    const now = Math.floor(Date.now() / 1000);
    const key = env.APPLE_PRIVATE_KEY!.replace(/\\n/g, '\n');

    return jwt.default.sign(
      {
        iss: env.APPLE_TEAM_ID!,
        iat: now,
        exp: now + 60 * 5,
        aud: 'https://appleid.apple.com',
        sub: env.APPLE_CLIENT_ID!,
      },
      key,
      {
        algorithm: 'ES256',
        keyid: env.APPLE_KEY_ID!,
      },
    );
  }
}
