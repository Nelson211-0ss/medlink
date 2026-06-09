import { Router } from 'express';
import { fileController } from '../controllers/file.controller';
import { authenticate } from '../middleware/authenticate';
import { upload } from '../middleware/upload';

const router = Router();

router.use(authenticate);
router.post('/avatar', upload.single('file'), fileController.upload('avatar'));
router.post('/cv', upload.single('file'), fileController.upload('cv'));
router.post('/certificate', upload.single('file'), fileController.upload('certificate'));
router.post('/license', upload.single('file'), fileController.upload('license'));
router.post('/message-attachment', upload.single('file'), fileController.upload('message'));

export default router;
