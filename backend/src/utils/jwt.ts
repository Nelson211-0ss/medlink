import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { JwtAccessPayload, JwtRefreshPayload } from '../types';
import { Role } from './constants';

export const signAccessToken = (user: { id: string; email: string; role: Role }): string => {
  const payload: JwtAccessPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    type: 'access',
  };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  } as SignOptions);
};

export const signRefreshToken = (userId: string, tokenId: string): string => {
  const payload: JwtRefreshPayload = { sub: userId, tokenId, type: 'refresh' };
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  } as SignOptions);
};

export const verifyAccessToken = (token: string): JwtAccessPayload => {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtAccessPayload;
  if (decoded.type !== 'access') throw new Error('Invalid token type');
  return decoded;
};

export const verifyRefreshToken = (token: string): JwtRefreshPayload => {
  const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtRefreshPayload;
  if (decoded.type !== 'refresh') throw new Error('Invalid token type');
  return decoded;
};
