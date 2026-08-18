import { z } from "zod";

export const publicInterestEventSchema = z
  .object({
    event_id: z.string().uuid(),
    event_type: z.enum([
      "product_viewed",
      "compatibility_checked",
      "checkout_started"
    ]),
    session_id: z.string().trim().min(8).max(160),
    product_id: z.string().uuid().nullable().optional(),
    product_slug: z.string().trim().max(180).nullable().optional(),
    device_brand: z.string().trim().max(80).nullable().optional(),
    device_model: z.string().trim().max(120).nullable().optional(),
    compatibility_status: z
      .enum(["compatible", "not_recommended", "unknown"])
      .nullable()
      .optional(),
    source_path: z.string().trim().max(300).nullable().optional()
  })
  .superRefine((input, context) => {
    if (
      ["product_viewed", "checkout_started"].includes(input.event_type) &&
      !input.product_id
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["product_id"],
        message: "Produto obrigatório para este evento."
      });
    }

    if (
      input.event_type === "compatibility_checked" &&
      (!input.device_brand || !input.device_model)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["device_model"],
        message: "Marca e modelo são obrigatórios."
      });
    }
  });

export type PublicInterestEventInput = z.infer<
  typeof publicInterestEventSchema
>;
