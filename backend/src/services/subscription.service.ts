import Stripe from 'stripe';
import { SubscriptionRepository } from '../repositories/subscription.repository';
import { UserRepository } from '../repositories/user.repository';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { SUBSCRIPTION_PLANS } from '../utils/constants';

export const PLAN_CATALOG = [
  {
    id: SUBSCRIPTION_PLANS.FREE,
    name: 'Free',
    price: 0,
    audience: 'professional',
    features: ['Basic profile', 'Limited applications', 'Standard visibility'],
  },
  {
    id: SUBSCRIPTION_PLANS.PREMIUM_PRO,
    name: 'Premium Professional',
    price: 19,
    audience: 'professional',
    features: ['Featured profile', 'Unlimited applications', 'Priority visibility'],
  },
  {
    id: SUBSCRIPTION_PLANS.PREMIUM_ORG,
    name: 'Premium Organization',
    price: 99,
    audience: 'organization',
    features: ['Unlimited job posts', 'Advanced search', 'Talent pool access'],
  },
];

export class SubscriptionService {
  private stripe: Stripe | null;

  constructor(
    private subscriptions: SubscriptionRepository,
    private users: UserRepository,
  ) {
    this.stripe = env.STRIPE_SECRET_KEY
      ? new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2024-04-10' })
      : null;
  }

  listPlans() {
    return PLAN_CATALOG;
  }

  async current(userId: string) {
    const sub = await this.subscriptions.findByUserId(userId);
    return sub ?? { plan: SUBSCRIPTION_PLANS.FREE, status: 'active' };
  }

  private priceFor(plan: string): string {
    if (plan === SUBSCRIPTION_PLANS.PREMIUM_PRO) return env.STRIPE_PRICE_PREMIUM_PRO;
    if (plan === SUBSCRIPTION_PLANS.PREMIUM_ORG) return env.STRIPE_PRICE_PREMIUM_ORG;
    throw new BadRequestError('Invalid plan');
  }

  async createCheckoutSession(userId: string, plan: string) {
    if (!this.stripe) throw new BadRequestError('Payments are not configured');
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundError('User not found');

    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: user.email,
      line_items: [{ price: this.priceFor(plan), quantity: 1 }],
      success_url: `${env.FRONTEND_URL}/billing?status=success`,
      cancel_url: `${env.FRONTEND_URL}/billing?status=cancel`,
      metadata: { userId, plan },
    });
    return { url: session.url, sessionId: session.id };
  }

  async handleWebhook(rawBody: Buffer, signature: string) {
    if (!this.stripe || !env.STRIPE_WEBHOOK_SECRET) {
      throw new BadRequestError('Webhook not configured');
    }
    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      logger.error({ err }, 'Stripe webhook signature verification failed');
      throw new BadRequestError('Invalid webhook signature');
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const s = event.data.object as Stripe.Checkout.Session;
        const userId = s.metadata?.userId;
        const plan = s.metadata?.plan;
        if (userId && plan) {
          await this.subscriptions.upsertPlan({
            userId,
            plan,
            status: 'active',
            stripeCustomerId: s.customer as string,
            stripeSubscriptionId: s.subscription as string,
          });
        }
        break;
      }
      case 'customer.subscription.deleted':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const existing = await this.subscriptions.findByStripeSubscriptionId(sub.id);
        if (existing) {
          await this.subscriptions.update(existing.id, {
            status: sub.status,
            current_period_end: sub.current_period_end
              ? new Date(sub.current_period_end * 1000)
              : null,
            plan: sub.status === 'canceled' ? SUBSCRIPTION_PLANS.FREE : existing.plan,
          });
        }
        break;
      }
      default:
        break;
    }
    return { received: true };
  }
}
