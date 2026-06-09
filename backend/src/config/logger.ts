import pino from 'pino';
import { env, isProd } from './env';

export const logger = pino({
  level: isProd ? 'info' : 'debug',
  base: { service: 'medinexus-api' },
  transport: isProd
    ? undefined
    : {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'SYS:standard', ignore: 'pid,hostname' },
      },
});

export const httpLoggerOptions = {
  logger,
  autoLogging: { ignore: (req: { url?: string }) => req.url === `${env.API_PREFIX}/health` },
  customLogLevel: (_req: unknown, res: { statusCode: number }, err: unknown) => {
    if (res.statusCode >= 500 || err) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
};
