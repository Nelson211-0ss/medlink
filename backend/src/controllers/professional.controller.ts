import { container } from '../container';
import { asyncHandler } from '../utils/asyncHandler';
import { created, ok } from '../utils/apiResponse';

const { professionalService, matchingService } = container.services;

export const professionalController = {
  myProfile: asyncHandler(async (req, res) => {
    return ok(res, await professionalService.getByUserId(req.user!.id));
  }),

  updateMyProfile: asyncHandler(async (req, res) => {
    return ok(res, await professionalService.updateProfile(req.user!.id, req.body), 'Profile updated');
  }),

  getPublicProfile: asyncHandler(async (req, res) => {
    return ok(res, await professionalService.getFullProfile(req.params.id));
  }),

  setAvailability: asyncHandler(async (req, res) => {
    const { availability, openToOffers } = req.body;
    return ok(res, await professionalService.setAvailability(req.user!.id, availability, openToOffers));
  }),

  addEducation: asyncHandler(async (req, res) => {
    return created(res, await professionalService.addEducation(req.user!.id, req.body));
  }),

  addCertification: asyncHandler(async (req, res) => {
    return created(res, await professionalService.addCertification(req.user!.id, req.body));
  }),

  addLicense: asyncHandler(async (req, res) => {
    return created(res, await professionalService.addLicense(req.user!.id, req.body));
  }),

  addWorkExperience: asyncHandler(async (req, res) => {
    return created(res, await professionalService.addWorkExperience(req.user!.id, req.body));
  }),

  deleteEducation: asyncHandler(async (req, res) => {
    return ok(res, await professionalService.deleteEducation(req.user!.id, req.params.id));
  }),

  deleteCertification: asyncHandler(async (req, res) => {
    return ok(res, await professionalService.deleteCertification(req.user!.id, req.params.id));
  }),

  deleteLicense: asyncHandler(async (req, res) => {
    return ok(res, await professionalService.deleteLicense(req.user!.id, req.params.id));
  }),

  deleteWorkExperience: asyncHandler(async (req, res) => {
    return ok(res, await professionalService.deleteWorkExperience(req.user!.id, req.params.id));
  }),

  myMatches: asyncHandler(async (req, res) => {
    const profile = await professionalService.getByUserId(req.user!.id);
    return ok(res, await matchingService.jobsForProfessional(profile.id));
  }),
};
