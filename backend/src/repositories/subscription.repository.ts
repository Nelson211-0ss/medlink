import { query } from '../database/pool';
import { SubscriptionRow } from '../types/entities';
import { BaseRepository } from './base.repository';

export class SubscriptionRepository extends BaseRepository<SubscriptionRow> {
  protected table = 'subscriptions';

  findByUserId(userId: string): Promise<SubscriptionRow | null> {
    return this.findOne({ user_id: userId });
  }

  async upsertPlan(data: {
    userId: string;
    plan: string;
    status: string;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    currentPeriodEnd?: Date | null;
  }): Promise<SubscriptionRow> {
    const existing = await this.findByUserId(data.userId);
    if (existing) {
      const updated = await this.update(existing.id, {
        plan: data.plan,
        status: data.status,
        stripe_customer_id: data.stripeCustomerId ?? existing.stripe_customer_id,
        stripe_subscription_id: data.stripeSubscriptionId ?? existing.stripe_subscription_id,
        current_period_end: data.currentPeriodEnd ?? existing.current_period_end,
      });
      return updated as SubscriptionRow;
    }
    const { rows } = await query<SubscriptionRow>(
      `INSERT INTO subscriptions (user_id, plan, status, stripe_customer_id, stripe_subscription_id, current_period_end)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        data.userId,
        data.plan,
        data.status,
        data.stripeCustomerId ?? null,
        data.stripeSubscriptionId ?? null,
        data.currentPeriodEnd ?? null,
      ],
    );
    return rows[0];
  }

  async findByStripeSubscriptionId(id: string): Promise<SubscriptionRow | null> {
    return this.findOne({ stripe_subscription_id: id });
  }
}
