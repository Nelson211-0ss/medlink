import express, { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { httpLoggerOptions } from './config/logger';
import { swaggerSpec } from './config/swagger';
import { buildApiRouter } from './modules';
import { globalRateLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { subscriptionController } from './controllers/subscription.controller';

export const createApp = (): Express => {
  const app = express();
  app.set('trust proxy', 1);

  // Security & infra middleware
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGINS,
      credentials: true,
    }),
  );
  app.use(compression());
  app.use(cookieParser());
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  app.use(pinoHttp(httpLoggerOptions as any));

  // Stripe webhook needs the raw body BEFORE json parsing.
  app.post(
    `${env.API_PREFIX}/subscriptions/webhook`,
    express.raw({ type: 'application/json' }),
    subscriptionController.webhook,
  );

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  // API docs
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { customSiteTitle: 'MediNexus API' }));
  app.get('/docs.json', (_req, res) => res.json(swaggerSpec));

  // Rate limiting + routes
  app.use(env.API_PREFIX, globalRateLimiter, buildApiRouter());

  app.use(notFound);
  app.use(errorHandler);

  return app;
};
