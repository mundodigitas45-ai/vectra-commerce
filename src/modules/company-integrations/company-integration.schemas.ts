import { z } from "zod";

export const connectOpenAiSchema = z.object({
  api_key: z
    .string()
    .trim()
    .min(20)
    .max(512)
    .regex(
      /^\S+$/,
      "A chave não pode conter espaços ou quebras de linha."
    ),

  default_model: z
    .string()
    .trim()
    .min(2)
    .max(120)
    .optional()
    .default("gpt-4.1-mini")
});

export type ConnectOpenAiInput =
  z.infer<typeof connectOpenAiSchema>;


export const companyAiResponsesSchema = z.object({
  company_id: z
    .string()
    .uuid(),

  request: z
    .record(z.unknown())
    .refine(
      (value) =>
        value.input !== undefined,
      {
        message:
          "A requisição precisa conter input."
      }
    )
});

export type CompanyAiResponsesInput =
  z.infer<
    typeof companyAiResponsesSchema
  >;
