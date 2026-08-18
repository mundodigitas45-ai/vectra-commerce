import { z } from "zod";

const pixelConfigSchema = z.object({
  pixel_id: z
    .string()
    .trim()
    .min(5)
    .max(100)
});

export const createSiteIntegrationSchema = z.object({
  provider: z.literal("meta"),

  integration_type: z.literal("pixel"),

  name: z
    .string()
    .trim()
    .min(2)
    .max(120)
    .optional()
    .nullable(),

  public_config: pixelConfigSchema,

  is_enabled: z
    .boolean()
    .default(true)
});

export const updateSiteIntegrationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2)
    .max(120)
    .optional()
    .nullable(),

  public_config: pixelConfigSchema
    .optional(),

  is_enabled: z
    .boolean()
    .optional()
}).refine(
  (value) =>
    value.name !== undefined ||
    value.public_config !== undefined ||
    value.is_enabled !== undefined,
  {
    message: "Informe ao menos um campo para atualizar."
  }
);

export type CreateSiteIntegrationInput =
  z.infer<typeof createSiteIntegrationSchema>;

export type UpdateSiteIntegrationInput =
  z.infer<typeof updateSiteIntegrationSchema>;

export const setMetaCapiSecretSchema = z.object({
  access_token: z
    .string()
    .trim()
    .min(20)
    .max(4096)
    .regex(
      /^\S+$/,
      "O token CAPI não pode conter espaços ou quebras de linha."
    )
});

export type SetMetaCapiSecretInput =
  z.infer<typeof setMetaCapiSecretSchema>;
