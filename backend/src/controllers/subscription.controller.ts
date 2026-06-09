import { Request, Response } from 'express';
import { container } from '../container';
import { asyncHandler } from '../utils/asyncHandler';
import { ok } from '../utils/apiResponse';

const { subscriptionService } = container.services;

export const subscriptionController = {
  plans: asyncHandler(async (_req, res) => {
    return ok(res, subscriptionService.listPlans());
  }),

  current: asyncHandler(async (req, res) => {
    return ok(res, await subscriptionService.current(req.user!.id));
  }),

  checkout: asyncHandler(async (req, res) => {
    return ok(res, await subscriptionService.createCheckoutSession(req.user!.id, req.body.plan));
  }),

  // Mounted with express.raw() to preserve the body for signature verification.
  webhook: asyncHandler(async (req: Request, res: Response) => {
    const signature = req.headers['stripe-signature'] as string;
    const result = await subscriptionService.handleWebhook(req.body as Buffer, signature);
    return res.json(result);
  }),
};
