import { container } from '../container';
import { asyncHandler } from '../utils/asyncHandler';
import { ok } from '../utils/apiResponse';

const { organizationService, professionalService } = container.services;
const { savedRepo } = container.repositories;

export const savedController = {
  saveCandidate: asyncHandler(async (req, res) => {
    const org = await organizationService.getByUserId(req.user!.id);
    await savedRepo.saveCandidate(org.id, req.params.professionalId, req.body?.note);
    return ok(res, { saved: true }, 'Candidate saved');
  }),

  unsaveCandidate: asyncHandler(async (req, res) => {
    const org = await organizationService.getByUserId(req.user!.id);
    await savedRepo.unsaveCandidate(org.id, req.params.professionalId);
    return ok(res, { saved: false }, 'Candidate removed');
  }),

  listSavedCandidates: asyncHandler(async (req, res) => {
    const org = await organizationService.getByUserId(req.user!.id);
    return ok(res, await savedRepo.listSavedCandidates(org.id));
  }),

  saveJob: asyncHandler(async (req, res) => {
    const profile = await professionalService.getByUserId(req.user!.id);
    await savedRepo.saveJob(profile.id, req.params.jobId);
    return ok(res, { saved: true }, 'Job saved');
  }),

  unsaveJob: asyncHandler(async (req, res) => {
    const profile = await professionalService.getByUserId(req.user!.id);
    await savedRepo.unsaveJob(profile.id, req.params.jobId);
    return ok(res, { saved: false }, 'Job removed');
  }),

  listSavedJobs: asyncHandler(async (req, res) => {
    const profile = await professionalService.getByUserId(req.user!.id);
    return ok(res, await savedRepo.listSavedJobs(profile.id));
  }),
};
