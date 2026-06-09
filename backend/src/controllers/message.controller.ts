import { container } from '../container';
import { asyncHandler } from '../utils/asyncHandler';
import { created, ok } from '../utils/apiResponse';

const { messageService } = container.services;

export const messageController = {
  conversations: asyncHandler(async (req, res) => {
    return ok(res, await messageService.listConversations(req.user!.id));
  }),

  start: asyncHandler(async (req, res) => {
    return created(res, await messageService.startConversation(req.user!.id, req.body.userId));
  }),

  messages: asyncHandler(async (req, res) => {
    const before = req.query.before as string | undefined;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    return ok(res, await messageService.listMessages(req.user!.id, req.params.id, limit, before));
  }),

  send: asyncHandler(async (req, res) => {
    const msg = await messageService.sendMessage(
      req.user!.id,
      req.params.id,
      req.body.body,
      req.body.attachmentUrl,
    );
    return created(res, msg, 'Message sent');
  }),

  markRead: asyncHandler(async (req, res) => {
    return ok(res, await messageService.markRead(req.user!.id, req.params.id));
  }),
};
