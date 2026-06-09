import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { redis } from '../config/redis';
import { env } from '../config/env';

const store = new RedisStore({
  sendCommand: (...args: string[]) => redis.call(...(args as [string])) as Promise<never>,
  prefix: 'rl:',
});

export const globalRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  store,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
});
