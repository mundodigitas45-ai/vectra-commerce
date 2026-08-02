import { supabase } from "../../config/supabase";

import type {
  CreateOrderInput,
  OrderStatus
} from "./order.schemas";

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

  async list() {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", {
        ascending: false
      })
      .limit(100);

    if (error) {
      throw new Error(error.message);
    }

    return data ?? [];
  }

  async findById(orderId: string) {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async confirmStock(orderId: string) {
    const { data, error } = await supabase.rpc(
      "confirm_order_stock",
      {
        p_order_id: orderId
      }
    );

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async releaseReservedStock(
    orderId: string,
    reason: string
  ) {
    const { data, error } = await supabase.rpc(
      "release_order_stock",
      {
        p_order_id: orderId,
        p_reason: reason
      }
    );

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async returnConfirmedStock(
    orderId: string,
    reason: string
  ) {
    const { data, error } = await supabase.rpc(
      "return_confirmed_order_stock",
      {
        p_order_id: orderId,
        p_reason: reason
      }
    );

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async updateStatus(
    orderId: string,
    status: OrderStatus
  ) {
    const timestampFields: Partial<
      Record<OrderStatus, string>
    > = {
      confirmed: "confirmed_at",
      dispatched: "dispatched_at",
      delivered: "delivered_at",
      cancelled: "cancelled_at"
    };

    const updates: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString()
    };

    const timestampField =
      timestampFields[status];

    if (timestampField) {
      updates[timestampField] =
        new Date().toISOString();
    }

    if (
      status === "cancelled" ||
      status === "confirmed"
    ) {
      updates.reservation_expires_at = null;
    }

    const { data, error } = await supabase
      .from("orders")
      .update(updates)
      .eq("id", orderId)
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }
}

export const orderRepository =
  new OrderRepository();
