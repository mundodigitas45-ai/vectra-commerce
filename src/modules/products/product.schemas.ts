import { z } from "zod";

export const createProductSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "O nome precisa ter pelo menos 2 caracteres.")
    .max(150),

  description: z
    .string()
    .trim()
    .max(1000)
    .nullable()
    .optional(),

  power_watts: z
    .number()
    .int()
    .min(1)
    .max(10000)
    .nullable()
    .optional(),

  connector_type: z
    .string()
    .trim()
    .max(100)
    .nullable()
    .optional(),

  cost_price: z
    .number()
    .min(0, "O preço de custo não pode ser negativo."),

  sale_price: z
    .number()
    .min(0.01, "O preço de venda precisa ser maior que zero."),

  stock_quantity: z
    .number()
    .int()
    .min(0)
    .max(100000),

  low_stock_threshold: z
    .number()
    .int()
    .min(0)
    .max(100000)
    .default(3),

  warranty_days: z
    .number()
    .int()
    .min(0)
    .max(3650)
    .default(30),

  image_url: z
    .string()
    .url("A URL da imagem é inválida.")
    .nullable()
    .optional(),

  category_id: z
    .string()
    .uuid()
    .nullable()
    .optional()
});

export type CreateProductInput = z.infer<
  typeof createProductSchema
>;