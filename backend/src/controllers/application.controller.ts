import { container } from '../container';
import { asyncHandler } from '../utils/asyncHandler';
import { created, ok } from '../utils/apiResponse';

const { applicationService } = container.services;

export const applicationController = {
  apply: asyncHandler(async (req, res) => {
    const result = await applicationService.apply(req.user!.id, req.params.jobId, req.body);
    return created(res, result, 'Application submitted');
  }),

  myApplications: asyncHandler(async (req, res) => {
    return ok(res, await applicationService.listMine(req.user!.id));
  }),

  forJob: asyncHandler(async (req, res) => {
    return ok(res, await applicationService.listForJob(req.user!.id, req.params.jobId));
  }),

  updateStage: asyncHandler(async (req, res) => {
    return ok(res, await applicationService.updateStage(req.user!.id, req.params.id, req.body.stage), 'Stage updated');
  }),

  pipeline: asyncHandler(async (req, res) => {
    return ok(res, await applicationService.pipeline(req.user!.id));
  }),
};
