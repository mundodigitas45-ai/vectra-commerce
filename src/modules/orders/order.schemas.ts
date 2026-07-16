import { z } from "zod";

export const createOrderSchema = z.object({
  customer: z.object({
    name: z.string().trim().min(2).max(120),
    phone: z.string().trim().min(10).max(20),
    neighborhood: z.string().trim().min(2).max(120),
    address: z.string().trim().min(3).max(250),
    reference: z.string().trim().max(250).nullable().optional()
  }),

  items: z
    .array(
      z.object({
        product_id: z.string().uuid(),
        quantity: z.number().int().min(1).max(20)
      })
    )
    .min(1)
    .max(20),

  payment_method: z.enum(["pix", "cash"]),

  preferred_delivery_time: z
    .string()
    .trim()
    .max(100)
    .nullable()
    .optional(),

  notes: z
    .string()
    .trim()
    .max(500)
    .nullable()
    .optional()
});

export type CreateOrderInput = z.infer<
  typeof createOrderSchema
>;