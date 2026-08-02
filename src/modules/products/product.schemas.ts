import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().trim().min(2).max(150),
  slug: z.string().trim().min(2).max(160).optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  power_watts: z.number().int().min(1).max(10000).nullable().optional(),
  connector_type: z.string().trim().max(100).nullable().optional(),
  cost_price: z.number().min(0),
  sale_price: z.number().min(0),
  initial_stock: z.number().int().min(0).default(0),
  minimum_quantity: z.number().int().min(0).default(3),
  maximum_quantity: z.number().int().min(0).nullable().optional(),
  warranty_days: z.number().int().min(0).default(30),
  image_url: z.string().url().nullable().optional(),
  category_id: z.string().uuid().nullable().optional(),
  metadata: z.record(z.unknown()).optional()
});

export const updateProductSchema = z.object({
  name: z.string().trim().min(2).max(150).optional(),
  slug: z.string().trim().min(2).max(160).optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  power_watts: z.number().int().min(1).max(10000).nullable().optional(),
  connector_type: z.string().trim().max(100).nullable().optional(),
  cost_price: z.number().min(0).optional(),
  sale_price: z.number().min(0).optional(),
  minimum_quantity: z.number().int().min(0).optional(),
  maximum_quantity: z.number().int().min(0).nullable().optional(),
  warranty_days: z.number().int().min(0).optional(),
  image_url: z.string().url().nullable().optional(),
  category_id: z.string().uuid().nullable().optional(),
  metadata: z.record(z.unknown()).optional()
}).refine(
  (data) => Object.keys(data).length > 0,
  "Informe pelo menos um campo para atualizar."
);

export const updateProductStatusSchema = z.object({
  is_active: z.boolean()
});

export type CreateProductInput =
  z.infer<typeof createProductSchema>;

export type UpdateProductInput =
  z.infer<typeof updateProductSchema>;

export type UpdateProductStatusInput =
  z.infer<typeof updateProductStatusSchema>;
