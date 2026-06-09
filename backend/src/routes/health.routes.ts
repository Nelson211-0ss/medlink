import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { checkDatabase } from '../database/pool';
import { checkRedis } from '../config/redis';
import { checkElasticsearch } from '../config/elasticsearch';

const router = Router();

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const [db, redis, es] = await Promise.all([
      checkDatabase(),
      checkRedis(),
      checkElasticsearch(),
    ]);
    const healthy = db; // DB is critical; others are degraded-tolerant
    res.status(healthy ? 200 : 503).json({
      success: healthy,
      status: healthy ? 'ok' : 'degraded',
      services: { database: db, redis, elasticsearch: es },
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  }),
);

export default router;
