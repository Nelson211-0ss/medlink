import { Router } from 'express';
import healthRoutes from '../routes/health.routes';
import authRoutes from '../routes/auth.routes';
import professionalRoutes from '../routes/professional.routes';
import organizationRoutes from '../routes/organization.routes';
import jobRoutes from '../routes/job.routes';
import applicationRoutes from '../routes/application.routes';
import matchRoutes from '../routes/match.routes';
import savedRoutes from '../routes/saved.routes';
import messageRoutes from '../routes/message.routes';
import notificationRoutes from '../routes/notification.routes';
import searchRoutes from '../routes/search.routes';
import fileRoutes from '../routes/file.routes';
import subscriptionRoutes from '../routes/subscription.routes';
import adminRoutes from '../routes/admin.routes';
import dashboardRoutes from '../routes/dashboard.routes';

/** Feature module registry — single source of truth for route mounting. */
export const modules = [
  { path: '/health', router: healthRoutes },
  { path: '/auth', router: authRoutes },
  { path: '/professionals', router: professionalRoutes },
  { path: '/organizations', router: organizationRoutes },
  { path: '/jobs', router: jobRoutes },
  { path: '/applications', router: applicationRoutes },
  { path: '/matches', router: matchRoutes },
  { path: '/saved', router: savedRoutes },
  { path: '/messages', router: messageRoutes },
  { path: '/notifications', router: notificationRoutes },
  { path: '/search', router: searchRoutes },
  { path: '/files', router: fileRoutes },
  { path: '/subscriptions', router: subscriptionRoutes },
  { path: '/admin', router: adminRoutes },
  { path: '/dashboard', router: dashboardRoutes },
];

export const buildApiRouter = (): Router => {
  const router = Router();
  for (const m of modules) router.use(m.path, m.router);
  return router;
};
