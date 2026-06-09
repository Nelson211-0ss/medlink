import { Router } from 'express';
import { applicationController } from '../controllers/application.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { ROLES } from '../utils/constants';

const router = Router();

router.get('/me', authenticate, authorize(ROLES.PROFESSIONAL), applicationController.myApplications);
router.get('/pipeline', authenticate, authorize(ROLES.ORGANIZATION), applicationController.pipeline);
router.patch('/:id/stage', authenticate, authorize(ROLES.ORGANIZATION), applicationController.updateStage);

export default router;
