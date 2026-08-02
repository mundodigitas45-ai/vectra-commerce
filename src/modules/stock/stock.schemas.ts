import { z } from "zod";

const baseSchema = z.object({
  inventory_id: z.string().uuid(),
  reason: z.string().trim().min(3).max(300),
  notes: z.string().trim().max(500).nullable().optional(),
});

export const stockEntrySchema = baseSchema.extend({
  quantity: z.number().int().min(1),
});

export const stockRemovalSchema = baseSchema.extend({
  quantity: z.number().int().min(1),
});

export const stockAdjustmentSchema = baseSchema.extend({
  new_quantity: z.number().int().min(0),
});

export type StockEntryInput = z.infer<typeof stockEntrySchema>;
export type StockRemovalInput = z.infer<typeof stockRemovalSchema>;
export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>;
