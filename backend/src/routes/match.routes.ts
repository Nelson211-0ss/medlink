import { Router } from 'express';
import { matchController } from '../controllers/match.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { ROLES } from '../utils/constants';

const router = Router();

router.get('/recommended-jobs', authenticate, authorize(ROLES.PROFESSIONAL), matchController.recommendedJobs);
router.get('/score', authenticate, matchController.scorePair);
router.post('/:matchId/swipe', authenticate, matchController.swipe);

export default router;
