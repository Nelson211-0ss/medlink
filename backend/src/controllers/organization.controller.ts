import { container } from '../container';
import { asyncHandler } from '../utils/asyncHandler';
import { ok } from '../utils/apiResponse';

const { organizationService } = container.services;

export const organizationController = {
  myProfile: asyncHandler(async (req, res) => {
    return ok(res, await organizationService.getByUserId(req.user!.id));
  }),

  updateMyProfile: asyncHandler(async (req, res) => {
    return ok(res, await organizationService.updateProfile(req.user!.id, req.body), 'Organization updated');
  }),

  getPublicProfile: asyncHandler(async (req, res) => {
    return ok(res, await organizationService.getById(req.params.id));
  }),
};
