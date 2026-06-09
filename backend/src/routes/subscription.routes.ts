import { Router } from 'express';
import { subscriptionController } from '../controllers/subscription.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

router.get('/plans', subscriptionController.plans);
router.get('/me', authenticate, subscriptionController.current);
router.post('/checkout', authenticate, subscriptionController.checkout);

export default router;
