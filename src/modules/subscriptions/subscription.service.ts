import { subscriptionRepository } from "./subscription.repository";

type PublicPlanRow = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  billing_interval: string;
  price_amount: number | string | null;
  currency: string;
  trial_days: number;
  sort_order: number;
  features: Array<{
    id: string;
    feature_key: string;
    feature_name: string;
    is_enabled: boolean;
    is_public: boolean;
    limit_value: number | null;
    configuration: Record<string, unknown> | null;
  }> | null;
};

export class SubscriptionService {
  async listPublicPlans() {
    const rows =
      (await subscriptionRepository.listPublicPlans()) as PublicPlanRow[];

    return rows.map((plan) => ({
      id: plan.id,
      code: plan.code,
      name: plan.name,
      description: plan.description,
      billing_interval: plan.billing_interval,
      price_amount:
        plan.price_amount == null
          ? null
          : Number(plan.price_amount),
      currency: plan.currency.trim(),
      trial_days: plan.trial_days,
      features: (plan.features ?? [])
        .filter(
          (feature) =>
            feature.is_enabled &&
            feature.is_public
        )
        .map((feature) => ({
          key: feature.feature_key,
          name: feature.feature_name,
          limit: feature.limit_value,
          configuration: feature.configuration ?? {}
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    }));
  }
}

export const subscriptionService =
  new SubscriptionService();
