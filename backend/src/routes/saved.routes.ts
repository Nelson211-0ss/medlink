import { Router } from 'express';
import { savedController } from '../controllers/saved.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { ROLES } from '../utils/constants';

const router = Router();

// Organizations save candidates
router.get('/candidates', authenticate, authorize(ROLES.ORGANIZATION), savedController.listSavedCandidates);
router.post('/candidates/:professionalId', authenticate, authorize(ROLES.ORGANIZATION), savedController.saveCandidate);
router.delete('/candidates/:professionalId', authenticate, authorize(ROLES.ORGANIZATION), savedController.unsaveCandidate);

// Professionals save jobs
router.get('/jobs', authenticate, authorize(ROLES.PROFESSIONAL), savedController.listSavedJobs);
router.post('/jobs/:jobId', authenticate, authorize(ROLES.PROFESSIONAL), savedController.saveJob);
router.delete('/jobs/:jobId', authenticate, authorize(ROLES.PROFESSIONAL), savedController.unsaveJob);

export default router;
