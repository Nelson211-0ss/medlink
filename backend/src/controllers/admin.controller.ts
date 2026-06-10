import { container } from '../container';
import { asyncHandler } from '../utils/asyncHandler';
import { noContent, ok, paginated } from '../utils/apiResponse';
import { buildMeta, getPagination } from '../utils/pagination';

const { adminService } = container.services;

export const adminController = {
  stats: asyncHandler(async (_req, res) => {
    return ok(res, await adminService.stats());
  }),

  pendingVerifications: asyncHandler(async (_req, res) => {
    return ok(res, await adminService.listPendingVerifications());
  }),

  verifyProfessional: asyncHandler(async (req, res) => {
    return ok(res, await adminService.verifyProfessional(req.user!.id, req.params.id, req.body.approve));
  }),

  verifyOrganization: asyncHandler(async (req, res) => {
    return ok(res, await adminService.verifyOrganization(req.user!.id, req.params.id, req.body.approve));
  }),

  verifyLicense: asyncHandler(async (req, res) => {
    return ok(res, await adminService.verifyLicense(req.user!.id, req.params.id, req.body.approve));
  }),

  setUserStatus: asyncHandler(async (req, res) => {
    return ok(res, await adminService.setUserStatus(req.user!.id, req.params.id, req.body.status));
  }),

  listUsers: asyncHandler(async (req, res) => {
    const p = getPagination(req.query);
    const { users, total } = await adminService.listUsers({
      page: p.page,
      limit: p.limit,
      offset: p.offset,
      role: req.query.role as string | undefined,
      q: req.query.q as string | undefined,
    });
    return paginated(res, users, buildMeta(total, p.page, p.limit));
  }),

  deleteUser: asyncHandler(async (req, res) => {
    await adminService.deleteUser(req.user!.id, req.params.id);
    return noContent(res);
  }),

  auditLogs: asyncHandler(async (_req, res) => {
    return ok(res, await adminService.recentAuditLogs());
  }),
};
