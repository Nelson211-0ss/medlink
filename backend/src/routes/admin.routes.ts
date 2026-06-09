import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { ROLES } from '../utils/constants';

const router = Router();

router.use(authenticate, authorize(ROLES.ADMIN));
router.get('/stats', adminController.stats);
router.get('/verifications', adminController.pendingVerifications);
router.post('/professionals/:id/verify', adminController.verifyProfessional);
router.post('/organizations/:id/verify', adminController.verifyOrganization);
router.post('/licenses/:id/verify', adminController.verifyLicense);
router.post('/users/:id/status', adminController.setUserStatus);
router.get('/audit-logs', adminController.auditLogs);

export default router;
