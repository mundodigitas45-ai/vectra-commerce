import { z } from "zod";

export const createOnboardingSessionSchema =
  z.object({
    plan_code: z
      .string()
      .trim()
      .min(2)
      .max(80)
      .optional()
  });

export const updateOnboardingSessionSchema =
  z
    .object({
      plan_code: z
        .string()
        .trim()
        .min(2)
        .max(80)
        .optional(),
      company_name: z
        .string()
        .trim()
        .min(2)
        .max(160)
        .optional(),
      contact_name: z
        .string()
        .trim()
        .min(2)
        .max(120)
        .optional(),
      contact_phone: z
        .string()
        .trim()
        .min(10)
        .max(20)
        .optional(),
      document: z
        .string()
        .trim()
        .max(30)
        .nullable()
        .optional()
    })
    .refine(
      (input) =>
        Object.values(input).some(
          (value) => value !== undefined
        ),
      {
        message:
          "Informe pelo menos um campo para atualizar."
      }
    );

export type CreateOnboardingSessionInput =
  z.infer<
    typeof createOnboardingSessionSchema
  >;

export type UpdateOnboardingSessionInput =
  z.infer<
    typeof updateOnboardingSessionSchema
  >;
