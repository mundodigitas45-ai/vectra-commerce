import { z } from "zod";

export const createDeliveryZoneSchema = z.object({
  neighborhood: z
    .string()
    .trim()
    .min(2, "Informe o nome do bairro.")
    .max(150),

  delivery_fee: z
    .number()
    .min(0, "A taxa não pode ser negativa.")
    .max(1000),

  estimated_delivery_cost: z
    .number()
    .min(0)
    .max(1000)
    .default(0),

  is_active: z.boolean().default(true)
});

export const updateDeliveryZoneSchema = z
  .object({
    neighborhood: z
      .string()
      .trim()
      .min(2)
      .max(150)
      .optional(),

    delivery_fee: z
      .number()
      .min(0)
      .max(1000)
      .optional(),

    estimated_delivery_cost: z
      .number()
      .min(0)
      .max(1000)
      .optional()
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    "Informe pelo menos um campo para atualizar."
  );

export const updateDeliveryZoneStatusSchema = z.object({
  is_active: z.boolean()
});

export const deliveryZoneParamsSchema = z.object({
  zoneId: z.string().uuid()
});

export type CreateDeliveryZoneInput =
  z.infer<typeof createDeliveryZoneSchema>;

export type UpdateDeliveryZoneInput =
  z.infer<typeof updateDeliveryZoneSchema>;

export type UpdateDeliveryZoneStatusInput =
  z.infer<typeof updateDeliveryZoneStatusSchema>;
