import { z } from "zod";

export const createSiteSchema = z.object({
  name: z.string().trim().min(2).max(120),

  domain: z
    .string()
    .trim()
    .min(3)
    .max(253),

  base_url: z
    .string()
    .trim()
    .url()
    .max(500)
    .optional()
    .nullable(),

  store_id: z
    .string()
    .uuid()
    .optional()
    .nullable(),

  environment: z
    .enum([
      "production",
      "staging",
      "development"
    ])
    .default("production"),

  is_active: z
    .boolean()
    .default(true)
});

export type CreateSiteInput =
  z.infer<typeof createSiteSchema>;
