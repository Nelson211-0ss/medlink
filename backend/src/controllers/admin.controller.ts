import { container } from '../container';
import { asyncHandler } from '../utils/asyncHandler';
import { ok } from '../utils/apiResponse';

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

  auditLogs: asyncHandler(async (_req, res) => {
    return ok(res, await adminService.recentAuditLogs());
  }),
};
