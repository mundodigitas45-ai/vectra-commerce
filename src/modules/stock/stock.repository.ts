import { supabase } from "../../config/supabase";

interface ApplyMovementInput {
  inventoryId: string;
  operation: "entry" | "removal" | "adjustment";
  quantity?: number;
  newQuantity?: number;
  reason: string;
  notes?: string | null;
  actorEmail: string;
}

export class StockRepository {
  async applyManualMovement(input: ApplyMovementInput) {
    const { data, error } = await supabase.rpc(
      "apply_manual_stock_movement",
      {
        p_inventory_id: input.inventoryId,
        p_operation: input.operation,
        p_quantity: input.quantity ?? null,
        p_new_quantity: input.newQuantity ?? null,
        p_reason: input.reason,
        p_notes: input.notes ?? null,
        p_actor_email: input.actorEmail,
      }
    );

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }
}

export const stockRepository = new StockRepository();
