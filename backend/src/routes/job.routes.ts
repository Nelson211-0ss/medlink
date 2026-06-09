import { Router } from 'express';
import { jobController } from '../controllers/job.controller';
import { applicationController } from '../controllers/application.controller';
import { authenticate, optionalAuth } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { ROLES } from '../utils/constants';
import { createJobSchema, updateJobSchema } from '../validators/job.validator';

const router = Router();
const onlyOrg = [authenticate, authorize(ROLES.ORGANIZATION)];

router.get('/', optionalAuth, jobController.list);
router.get('/mine/list', ...onlyOrg, jobController.myJobs);
router.post('/', ...onlyOrg, validate({ body: createJobSchema }), jobController.create);
router.get('/:id', optionalAuth, jobController.getOne);
router.patch('/:id', ...onlyOrg, validate({ body: updateJobSchema }), jobController.update);
router.delete('/:id', ...onlyOrg, jobController.remove);
router.get('/:id/candidates', ...onlyOrg, jobController.candidates);

// Applications nested under a job
router.post('/:jobId/apply', authenticate, authorize(ROLES.PROFESSIONAL), applicationController.apply);
router.get('/:jobId/applications', ...onlyOrg, applicationController.forJob);

export default router;
