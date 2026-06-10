import { Router } from 'express';
import { professionalController } from '../controllers/professional.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { ROLES } from '../utils/constants';

const orgOrAdmin = [authenticate, authorize(ROLES.ORGANIZATION, ROLES.ADMIN)];
import {
  updateProfessionalSchema,
  availabilitySchema,
} from '../validators/professional.validator';

const router = Router();
const onlyPro = [authenticate, authorize(ROLES.PROFESSIONAL)];

router.get('/me', ...onlyPro, professionalController.myProfile);
router.patch('/me', ...onlyPro, validate({ body: updateProfessionalSchema }), professionalController.updateMyProfile);
router.patch('/me/availability', ...onlyPro, validate({ body: availabilitySchema }), professionalController.setAvailability);
router.get('/me/matches', ...onlyPro, professionalController.myMatches);
router.post('/me/education', ...onlyPro, professionalController.addEducation);
router.post('/me/certifications', ...onlyPro, professionalController.addCertification);
router.post('/me/licenses', ...onlyPro, professionalController.addLicense);
router.post('/me/experience', ...onlyPro, professionalController.addWorkExperience);
router.delete('/me/education/:id', ...onlyPro, professionalController.deleteEducation);
router.delete('/me/certifications/:id', ...onlyPro, professionalController.deleteCertification);
router.delete('/me/licenses/:id', ...onlyPro, professionalController.deleteLicense);
router.delete('/me/experience/:id', ...onlyPro, professionalController.deleteWorkExperience);

router.get('/:id', ...orgOrAdmin, professionalController.getPublicProfile);

export default router;
