import { container } from '../container';
import { asyncHandler } from '../utils/asyncHandler';
import { created, ok, paginated } from '../utils/apiResponse';
import { getPagination, buildMeta } from '../utils/pagination';

const { jobService, matchingService } = container.services;

export const jobController = {
  create: asyncHandler(async (req, res) => {
    return created(res, await jobService.create(req.user!.id, req.body), 'Job posted');
  }),

  list: asyncHandler(async (req, res) => {
    const p = getPagination(req.query);
    const { rows, total } = await jobService.list(p, {
      profession: req.query.profession as string,
      country: req.query.country as string,
      q: req.query.q as string,
    });
    return paginated(res, rows, buildMeta(total, p.page, p.limit));
  }),

  getOne: asyncHandler(async (req, res) => {
    return ok(res, await jobService.getById(req.params.id, { incrementViews: true }));
  }),

  myJobs: asyncHandler(async (req, res) => {
    return ok(res, await jobService.listForOrganization(req.user!.id));
  }),

  update: asyncHandler(async (req, res) => {
    return ok(res, await jobService.update(req.user!.id, req.params.id, req.body), 'Job updated');
  }),

  remove: asyncHandler(async (req, res) => {
    return ok(res, await jobService.remove(req.user!.id, req.params.id), 'Job deleted');
  }),

  candidates: asyncHandler(async (req, res) => {
    return ok(res, await matchingService.candidatesForJob(req.params.id));
  }),
};
