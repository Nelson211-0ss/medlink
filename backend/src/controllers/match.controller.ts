import { container } from '../container';
import { asyncHandler } from '../utils/asyncHandler';
import { ok } from '../utils/apiResponse';

const { matchingService, professionalService } = container.services;

export const matchController = {
  recommendedJobs: asyncHandler(async (req, res) => {
    const profile = await professionalService.getByUserId(req.user!.id);
    return ok(res, await matchingService.jobsForProfessional(profile.id));
  }),

  scorePair: asyncHandler(async (req, res) => {
    const { jobId, professionalId } = req.query as { jobId: string; professionalId: string };
    return ok(res, await matchingService.scorePair(jobId, professionalId));
  }),

  swipe: asyncHandler(async (req, res) => {
    const { side, action } = req.body as { side: 'org' | 'prof'; action: 'liked' | 'passed' };
    return ok(res, await matchingService.recordSwipe(req.params.matchId, side, action));
  }),
};
