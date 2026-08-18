import { z } from "zod";
import { createOrderSchema } from "../orders/order.schemas";

export const checkoutSlugSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2)
    .max(180)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Produto inválido.")
});

export const checkoutQuoteSchema = z.object({
  product_id: z.string().uuid("O ID do produto é inválido."),
  quantity: z.number().int().min(1).max(20),
  neighborhood: z.string().trim().min(2).max(120)
});

const marketingSchema = z
  .object({
    source: z.string().trim().max(80).nullable().optional(),
    utm_source: z.string().trim().max(120).nullable().optional(),
    utm_medium: z.string().trim().max(120).nullable().optional(),
    utm_campaign: z.string().trim().max(160).nullable().optional(),
    utm_content: z.string().trim().max(160).nullable().optional()
  })
  .optional();

export const publicCheckoutOrderSchema = createOrderSchema.extend({
  marketing: marketingSchema,

  tracking_consent: z
    .enum([
      "granted",
      "denied",
      "unknown"
    ])
    .optional()
    .default("unknown")
});

export type CheckoutQuoteInput = z.infer<
  typeof checkoutQuoteSchema
>;

export type PublicCheckoutOrderInput = z.infer<
  typeof publicCheckoutOrderSchema
>;
