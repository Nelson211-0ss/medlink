import { Request, Response } from 'express';
import { container } from '../container';
import { asyncHandler } from '../utils/asyncHandler';
import { created, ok } from '../utils/apiResponse';
import { isProd } from '../config/env';

const { authService } = container.services;

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

export const authController = {
  register: asyncHandler(async (req, res) => {
    const result = await authService.register(req.body, meta(req));
    refreshCookie(res, result.refreshToken);
    return created(res, result, 'Account created');
  }),

  login: asyncHandler(async (req, res) => {
    const result = await authService.login(req.body.email, req.body.password, meta(req));
    refreshCookie(res, result.refreshToken);
    return ok(res, result, 'Logged in');
  }),

  refresh: asyncHandler(async (req, res) => {
    const token = req.cookies?.refresh_token || req.body?.refreshToken;
    const result = await authService.refresh(token, meta(req));
    refreshCookie(res, result.refreshToken);
    return ok(res, result, 'Token refreshed');
  }),

  logout: asyncHandler(async (req, res) => {
    await authService.logout(req.cookies?.refresh_token || req.body?.refreshToken);
    res.clearCookie('refresh_token', { path: '/api/v1/auth' });
    return ok(res, { loggedOut: true }, 'Logged out');
  }),

  me: asyncHandler(async (req, res) => {
    return ok(res, await authService.me(req.user!.id));
  }),

  verifyEmail: asyncHandler(async (req, res) => {
    return ok(res, await authService.verifyEmail(req.body.token), 'Email verified');
  }),

  forgotPassword: asyncHandler(async (req, res) => {
    return ok(res, await authService.forgotPassword(req.body.email), 'If the account exists, an email was sent');
  }),

  resetPassword: asyncHandler(async (req, res) => {
    return ok(res, await authService.resetPassword(req.body.token, req.body.password), 'Password reset');
  }),
};
