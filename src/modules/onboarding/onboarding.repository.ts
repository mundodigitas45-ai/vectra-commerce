import { supabase } from "../../config/supabase";

const openStatuses = [
  "started",
  "email_pending",
  "plan_selected",
  "payment_pending",
  "payment_confirmed",
  "provisioning"
];

export class OnboardingRepository {
  async findCurrent(userId: string) {
    const { data, error } = await supabase
      .from("onboarding_sessions")
      .select(`
        id,
        user_id,
        plan_id,
        company_id,
        status,
        company_name,
        contact_name,
        contact_email,
        contact_phone,
        document,
        billing_provider,
        external_checkout_id,
        expires_at,
        completed_at,
        created_at,
        updated_at,
        plan:plan_id (
          id,
          code,
          name,
          billing_interval,
          price_amount,
          currency,
          trial_days
        )
      `)
      .eq("user_id", userId)
      .in("status", openStatuses)
      .order("created_at", {
        ascending: false
      })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async hasCompanyAccess(userId: string) {
    const { data: membership, error } =
      await supabase
        .from("company_users")
        .select("company_id")
        .eq("user_id", userId)
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (membership) return true;

    const { data: owned, error: ownedError } =
      await supabase
        .from("companies")
        .select("id")
        .eq("owner_user_id", userId)
        .limit(1)
        .maybeSingle();

    if (ownedError) {
      throw new Error(ownedError.message);
    }

    return Boolean(owned);
  }

  async findPublicPlan(code: string) {
    const { data, error } = await supabase
      .from("saas_plans")
      .select(`
        id,
        code,
        name,
        billing_interval,
        price_amount,
        currency,
        trial_days
      `)
      .eq("code", code)
      .eq("status", "active")
      .eq("is_public", true)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async create(input: {
    userId: string;
    email: string | null;
    planId: string | null;
    status: "started" | "plan_selected";
    expiresAt: string;
  }) {
    const { data, error } = await supabase
      .from("onboarding_sessions")
      .insert({
        user_id: input.userId,
        contact_email: input.email,
        plan_id: input.planId,
        status: input.status,
        expires_at: input.expiresAt
      })
      .select("id")
      .single();

    if (error) {
      if (error.code === "23505") {
        return this.findCurrent(input.userId);
      }

      throw new Error(error.message);
    }

    return this.findById(data.id);
  }

  async findById(id: string) {
    const { data, error } = await supabase
      .from("onboarding_sessions")
      .select(`
        id,
        user_id,
        plan_id,
        company_id,
        status,
        company_name,
        contact_name,
        contact_email,
        contact_phone,
        document,
        billing_provider,
        external_checkout_id,
        expires_at,
        completed_at,
        created_at,
        updated_at,
        plan:plan_id (
          id,
          code,
          name,
          billing_interval,
          price_amount,
          currency,
          trial_days
        )
      `)
      .eq("id", id)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async update(
    id: string,
    values: Record<string, unknown>
  ) {
    const { error } = await supabase
      .from("onboarding_sessions")
      .update(values)
      .eq("id", id);

    if (error) {
      throw new Error(error.message);
    }

    return this.findById(id);
  }
}

export const onboardingRepository =
  new OnboardingRepository();
