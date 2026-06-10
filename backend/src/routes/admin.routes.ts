import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { ROLES } from '../utils/constants';
import {
  adminUserIdSchema,
  listAdminUsersSchema,
  setUserStatusSchema,
} from '../validators/admin.validator';

const router = Router();

router.use(authenticate, authorize(ROLES.ADMIN));
router.get('/stats', adminController.stats);
router.get('/verifications', adminController.pendingVerifications);
router.get('/users', validate({ query: listAdminUsersSchema }), adminController.listUsers);
router.delete('/users/:id', validate({ params: adminUserIdSchema }), adminController.deleteUser);
router.post('/professionals/:id/verify', adminController.verifyProfessional);
router.post('/organizations/:id/verify', adminController.verifyOrganization);
router.post('/licenses/:id/verify', adminController.verifyLicense);
router.post(
  '/users/:id/status',
  validate({ params: adminUserIdSchema, body: setUserStatusSchema }),
  adminController.setUserStatus,
);
router.get('/audit-logs', adminController.auditLogs);

export default router;
