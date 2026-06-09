import { Router } from 'express';
import { messageController } from '../controllers/message.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

router.use(authenticate);
router.get('/conversations', messageController.conversations);
router.post('/conversations', messageController.start);
router.get('/conversations/:id/messages', messageController.messages);
router.post('/conversations/:id/messages', messageController.send);
router.post('/conversations/:id/read', messageController.markRead);

export default router;
