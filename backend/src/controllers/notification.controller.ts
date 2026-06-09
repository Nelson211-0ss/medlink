import { container } from '../container';
import { asyncHandler } from '../utils/asyncHandler';
import { ok } from '../utils/apiResponse';

const { notificationService } = container.services;

export const notificationController = {
  list: asyncHandler(async (req, res) => {
    const [items, unread] = await Promise.all([
      notificationService.list(req.user!.id),
      notificationService.unreadCount(req.user!.id),
    ]);
    return ok(res, { items, unread });
  }),

  markRead: asyncHandler(async (req, res) => {
    await notificationService.markRead(req.params.id, req.user!.id);
    return ok(res, { read: true });
  }),

  markAllRead: asyncHandler(async (req, res) => {
    await notificationService.markAllRead(req.user!.id);
    return ok(res, { read: true });
  }),
};
