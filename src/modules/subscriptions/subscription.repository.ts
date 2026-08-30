import { supabase } from "../../config/supabase";

export class SubscriptionRepository {
  async listPublicPlans() {
    const { data, error } = await supabase
      .from("saas_plans")
      .select(`
        id,
        code,
        name,
        description,
        billing_interval,
        price_amount,
        currency,
        trial_days,
        sort_order,
        features:saas_plan_features (
          id,
          feature_key,
          feature_name,
          is_enabled,
          is_public,
          limit_value,
          configuration
        )
      `)
      .eq("status", "active")
      .eq("is_public", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return data ?? [];
  }
}

export const subscriptionRepository =
  new SubscriptionRepository();
