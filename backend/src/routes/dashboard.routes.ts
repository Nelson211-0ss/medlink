import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { ROLES } from '../utils/constants';

const router = Router();

router.get('/professional', authenticate, authorize(ROLES.PROFESSIONAL), dashboardController.professional);
router.get('/organization', authenticate, authorize(ROLES.ORGANIZATION), dashboardController.organization);

export default router;
