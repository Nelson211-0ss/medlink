import { Request, Response } from 'express';
import { container } from '../container';
import { asyncHandler } from '../utils/asyncHandler';
import { env, isProd } from '../config/env';

const { oauthService } = container.services;

const oauthErrorRedirect = (code: string) =>
  `${env.FRONTEND_URL}/oauth/callback?error=${code}`;

const refreshCookie = (res: Response, token: string) => {
  res.cookie('refresh_token', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/api/v1/auth',
  });
};

const meta = (req: Request) => ({
  userAgent: req.headers['user-agent'],
  ip: req.ip,
});

export const oauthController = {
  startGoogle: asyncHandler(async (req, res) => {
    const mode = req.query.mode === 'signup' ? 'signup' : 'login';
    const url = oauthService.start('google', mode);
    return res.redirect(url);
  }),

  startApple: asyncHandler(async (req, res) => {
    const mode = req.query.mode === 'signup' ? 'signup' : 'login';
    const url = oauthService.start('apple', mode);
    return res.redirect(url);
  }),

  googleCallback: asyncHandler(async (req, res) => {
    const { code, state, error } = req.query as { code?: string; state?: string; error?: string };
    if (error) {
      return res.redirect(oauthErrorRedirect(error === 'access_denied' ? 'oauth_denied' : 'oauth_failed'));
    }
    if (!code || !state) {
      return res.redirect(oauthErrorRedirect('oauth_failed'));
    }

    const result = await oauthService.handleGoogleCallback(code, state, meta(req));
    if (result.tokens?.refreshToken) refreshCookie(res, result.tokens.refreshToken);
    return res.redirect(result.redirect);
  }),

  appleCallback: asyncHandler(async (req, res) => {
    const { code, state, user, error } = req.body as {
      code?: string;
      state?: string;
      user?: string;
      error?: string;
    };

    if (error) {
      return res.redirect(
        oauthErrorRedirect(error === 'user_cancelled_authorize' ? 'oauth_denied' : 'oauth_failed'),
      );
    }

    const result = await oauthService.handleAppleCallback(code, state ?? '', user, meta(req));
    if (result.tokens?.refreshToken) refreshCookie(res, result.tokens.refreshToken);
    return res.redirect(result.redirect);
  }),
};
