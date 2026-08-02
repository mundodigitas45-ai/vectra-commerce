import {
  type StockAdjustmentInput,
  type StockEntryInput,
  type StockRemovalInput,
} from "./stock.schemas";
import { stockRepository } from "./stock.repository";

export class StockService {
  entry(input: StockEntryInput, actorEmail: string) {
    return stockRepository.applyManualMovement({
      inventoryId: input.inventory_id,
      operation: "entry",
      quantity: input.quantity,
      reason: input.reason,
      notes: input.notes,
      actorEmail,
    });
  }

  removal(input: StockRemovalInput, actorEmail: string) {
    return stockRepository.applyManualMovement({
      inventoryId: input.inventory_id,
      operation: "removal",
      quantity: input.quantity,
      reason: input.reason,
      notes: input.notes,
      actorEmail,
    });
  }

  adjustment(input: StockAdjustmentInput, actorEmail: string) {
    return stockRepository.applyManualMovement({
      inventoryId: input.inventory_id,
      operation: "adjustment",
      newQuantity: input.new_quantity,
      reason: input.reason,
      notes: input.notes,
      actorEmail,
    });
  }
}

export const stockService = new StockService();
