import { z } from "zod";

export const updateSettingsSchema = z.object({
  name: z.string().trim().min(2).max(120),
  system_name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(10).max(20),
  whatsapp_phone: z.string().trim().min(10).max(20),
  address: z.string().trim().min(2).max(250),
  neighborhood: z.string().trim().min(2).max(120),
  city: z.string().trim().min(2).max(120),
  state: z.string().trim().length(2),
  warranty_days_default: z.number().int().min(0).max(365),
  low_stock_threshold_default: z.number().int().min(0).max(999),
  advertising_reserve_percentage: z.number().min(0).max(100),
  human_handoff_enabled: z.boolean()
});

export type UpdateSettingsInput = z.infer<
  typeof updateSettingsSchema
>;
