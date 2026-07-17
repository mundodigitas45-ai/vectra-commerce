import { z } from "zod";

export const createCustomerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "O nome precisa ter pelo menos 2 caracteres.")
    .max(120)
    .nullable()
    .optional(),

  phone: z
    .string()
    .trim()
    .min(10, "O telefone precisa ter pelo menos 10 números.")
    .max(20),

  email: z
    .string()
    .trim()
    .email("Informe um e-mail válido.")
    .max(150)
    .nullable()
    .optional(),

  neighborhood: z
    .string()
    .trim()
    .max(120)
    .nullable()
    .optional(),

  address: z
    .string()
    .trim()
    .max(250)
    .nullable()
    .optional(),

  reference: z
    .string()
    .trim()
    .max(250)
    .nullable()
    .optional(),

  notes: z
    .string()
    .trim()
    .max(500)
    .nullable()
    .optional()
});

export type CreateCustomerInput = z.infer<
  typeof createCustomerSchema
>;