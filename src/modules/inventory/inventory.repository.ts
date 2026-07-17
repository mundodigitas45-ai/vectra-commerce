import { supabase } from "../../config/supabase";

const COMPANY_ID =
  "e2e1f5bc-3f6c-4868-9d9c-5c8226df9b3d";

const STORE_ID =
  "f4a134bb-00fc-4314-bcd5-9d5cd45f036d";

type CreateMovementRecord = {
  inventory_id: string;
  product_id: string;
  movement_type: string;
  quantity: number;
  physical_before: number;
  physical_after: number;
  reserved_before: number;
  reserved_after: number;
  reason: string;
  metadata: Record<string, unknown>;
};

export class InventoryRepository {
  async findInventoryByProduct(productId: string) {
    const { data, error } = await supabase
      .from("inventories")
      .select(`
        id,
        company_id,
        store_id,
        product_id,
        physical_quantity,
        reserved_quantity,
        minimum_quantity
      `)
      .eq("company_id", COMPANY_ID)
      .eq("store_id", STORE_ID)
      .eq("product_id", productId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async updatePhysicalQuantity(
    inventoryId: string,
    quantity: number
  ) {
    const { data, error } = await supabase
      .from("inventories")
      .update({
        physical_quantity: quantity,
        last_counted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("id", inventoryId)
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async updateProductStock(
    productId: string,
    quantity: number
  ) {
    const { data, error } = await supabase
      .from("products")
      .update({
        stock_quantity: quantity,
        updated_at: new Date().toISOString()
      })
      .eq("id", productId)
      .eq("company_id", COMPANY_ID)
      .select("id, stock_quantity")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async createMovement(input: CreateMovementRecord) {
    const { data, error } = await supabase
      .from("stock_movements")
      .insert({
        company_id: COMPANY_ID,
        store_id: STORE_ID,
        inventory_id: input.inventory_id,
        product_id: input.product_id,
        order_id: null,
        movement_type: input.movement_type,
        quantity: input.quantity,
        physical_before: input.physical_before,
        physical_after: input.physical_after,
        reserved_before: input.reserved_before,
        reserved_after: input.reserved_after,
        reason: input.reason,
        metadata: input.metadata
      })
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async listMovements() {
    const { data, error } = await supabase
      .from("stock_movements")
      .select(`
        id,
        product_id,
        movement_type,
        quantity,
        physical_before,
        physical_after,
        reserved_before,
        reserved_after,
        reason,
        metadata,
        created_at
      `)
      .eq("company_id", COMPANY_ID)
      .eq("store_id", STORE_ID)
      .order("created_at", {
        ascending: false
      })
      .limit(100);

    if (error) {
      throw new Error(error.message);
    }

    return data ?? [];
  }
}

export const inventoryRepository =
  new InventoryRepository();