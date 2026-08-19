import { z } from "zod";

export const creativePlatformSchema = z.enum([
  "meta",
  "facebook_groups",
  "marketplace",
  "instagram",
  "whatsapp",
  "shopee",
  "olx",
  "tiktok",
  "kwai"
]);

export const createCreativeCampaignSchema = z.object({
  title: z.string().trim().min(2).max(160),
  product_id: z.string().uuid().nullable().optional(),
  workspace_id: z.string().uuid().nullable().optional(),
  objective: z
    .enum([
      "sales",
      "messages",
      "traffic",
      "catalog",
      "engagement"
    ])
    .default("sales"),
  primary_destination: z
    .enum(["whatsapp", "site", "platform"])
    .default("whatsapp"),
  audience: z.string().trim().max(1000).nullable().optional(),
  locale: z.string().trim().min(2).max(20).default("pt-BR"),
  include_price: z.boolean().default(true),
  platforms: z
    .array(creativePlatformSchema)
    .min(1)
    .max(9)
    .transform((items) => Array.from(new Set(items))),
  brief: z.record(z.unknown()).default({})
});

export const requestCreativeGenerationSchema = z.object({
  force_new: z.boolean().default(false),
  requested_outputs: z
    .array(
      z.enum([
        "strategy",
        "copy",
        "image",
        "video",
        "review"
      ])
    )
    .min(1)
    .max(5)
    .default(["strategy", "copy"])
});

export const reviewCreativeAssetSchema = z
  .object({
    decision: z.enum([
      "approved",
      "changes_requested",
      "rejected"
    ]),
    feedback: z
      .string()
      .trim()
      .max(2000)
      .nullable()
      .optional()
  })
  .superRefine((input, context) => {
    if (
      input.decision === "changes_requested" &&
      !input.feedback
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["feedback"],
        message:
          "Informe o que deve ser alterado nesta versão."
      });
    }
  });

export type CreativePlatform =
  z.infer<typeof creativePlatformSchema>;

export type CreateCreativeCampaignInput =
  z.infer<typeof createCreativeCampaignSchema>;

export type RequestCreativeGenerationInput =
  z.infer<typeof requestCreativeGenerationSchema>;

export type ReviewCreativeAssetInput =
  z.infer<typeof reviewCreativeAssetSchema>;
