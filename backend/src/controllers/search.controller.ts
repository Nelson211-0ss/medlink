import { container } from '../container';
import { asyncHandler } from '../utils/asyncHandler';
import { ok } from '../utils/apiResponse';

const { searchService } = container.services;

export const searchController = {
  professionals: asyncHandler(async (req, res) => {
    const { q, profession, specialization, country, city, availability, page, limit, sort } =
      req.query as Record<string, string>;
    const result = await searchService.searchProfessionals({
      q,
      filters: { profession, specialization, country, city, availability },
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      sort,
    });
    return ok(res, result);
  }),

  jobs: asyncHandler(async (req, res) => {
    const { q, profession, specialization, country, city, employmentType, page, limit, sort } =
      req.query as Record<string, string>;
    const result = await searchService.searchJobs({
      q,
      filters: { profession, specialization, country, city, employmentType },
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      sort,
    });
    return ok(res, result);
  }),
};
