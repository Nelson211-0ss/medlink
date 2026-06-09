import { Router } from 'express';
import { searchController } from '../controllers/search.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

router.get('/professionals', authenticate, searchController.professionals);
router.get('/jobs', searchController.jobs);

export default router;
