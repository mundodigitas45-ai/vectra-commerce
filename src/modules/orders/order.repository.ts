import { supabase } from "../../config/supabase";
import type { CreateOrderInput } from "./order.schemas";

export class OrderRepository {
  async create(
    input: CreateOrderInput,
    siteId?: string | null
  ) {
    const { data, error } = await supabase.rpc(
      "create_order_with_reservation",
      {
        p_customer: input.customer,
        p_items: input.items,
        p_payment_method: input.payment_method,
        p_preferred_delivery_time:
          input.preferred_delivery_time ?? null,
        p_notes: input.notes ?? null,
        p_site_id: siteId ?? null
      }
    );

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async recordTrackingConsent(
    orderId: string,
    status: "granted" | "denied" | "unknown"
  ) {
    const { data, error } = await supabase.rpc(
      "record_order_tracking_consent",
      {
        p_order_id: orderId,
        p_provider: "meta",
        p_status: status,
        p_source: "site_banner",
        p_policy_version: "v1"
      }
    );

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async list() {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .limit(50);

    if (error) {
      throw new Error(error.message);
    }

    return data ?? [];
  }
}

export const orderRepository = new OrderRepository();