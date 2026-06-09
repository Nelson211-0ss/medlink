import { Router } from 'express';
import { searchController } from '../controllers/search.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { ROLES } from '../utils/constants';

const router = Router();

router.get(
  '/professionals',
  authenticate,
  authorize(ROLES.ORGANIZATION, ROLES.ADMIN),
  searchController.professionals,
);
router.get('/jobs', searchController.jobs);

export default router;
