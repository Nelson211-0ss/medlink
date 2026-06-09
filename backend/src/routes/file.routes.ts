import { Router } from 'express';
import { fileController } from '../controllers/file.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { upload } from '../middleware/upload';
import { ROLES } from '../utils/constants';

const router = Router();

router.use(authenticate);
router.post('/avatar', upload.single('file'), fileController.uploadAvatar);
router.post('/logo', authorize(ROLES.ORGANIZATION), upload.single('file'), fileController.uploadOrgLogo);
router.post('/cv', upload.single('file'), fileController.upload('cv'));
router.post('/certificate', upload.single('file'), fileController.upload('certificate'));
router.post('/license', upload.single('file'), fileController.upload('license'));
router.post('/message-attachment', upload.single('file'), fileController.upload('message'));

export default router;
