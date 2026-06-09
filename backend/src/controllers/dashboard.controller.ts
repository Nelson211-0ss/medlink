import { container } from '../container';
import { asyncHandler } from '../utils/asyncHandler';
import { ok } from '../utils/apiResponse';

const { dashboardService } = container.services;

export const dashboardController = {
  professional: asyncHandler(async (req, res) => {
    return ok(res, await dashboardService.professionalOverview(req.user!.id));
  }),

  organization: asyncHandler(async (req, res) => {
    return ok(res, await dashboardService.organizationOverview(req.user!.id));
  }),
};
