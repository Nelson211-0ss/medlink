import { Router } from 'express';
import { organizationController } from '../controllers/organization.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { ROLES } from '../utils/constants';
import { updateOrganizationSchema } from '../validators/professional.validator';

const router = Router();
const onlyOrg = [authenticate, authorize(ROLES.ORGANIZATION)];

router.get('/me', ...onlyOrg, organizationController.myProfile);
router.patch('/me', ...onlyOrg, validate({ body: updateOrganizationSchema }), organizationController.updateMyProfile);
router.get('/:id', authenticate, organizationController.getPublicProfile);

export default router;
