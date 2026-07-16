import { supabase } from "../../config/supabase";
import type { CreateOrderInput } from "./order.schemas";

export class OrderRepository {
  async create(input: CreateOrderInput) {
    const { data, error } = await supabase.rpc(
      "create_order_with_reservation",
      {
        p_customer: input.customer,
        p_items: input.items,
        p_payment_method: input.payment_method,
        p_preferred_delivery_time:
          input.preferred_delivery_time ?? null,
        p_notes: input.notes ?? null
      }
    );

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }
}

export const orderRepository = new OrderRepository();