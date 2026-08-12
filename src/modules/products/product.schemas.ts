import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().trim().min(2, "O nome precisa ter pelo menos 2 caracteres.").max(150),
  description: z.string().trim().max(1000).nullable().optional(),
  power_watts: z.number().int().min(1).max(10000).nullable().optional(),
  connector_type: z.string().trim().max(100).nullable().optional(),
  cost_price: z.number().min(0, "O preço de custo não pode ser negativo."),
  sale_price: z.number().min(0.01, "O preço de venda precisa ser maior que zero."),
  stock_quantity: z.number().int().min(0).max(100000),
  low_stock_threshold: z.number().int().min(0).max(100000).default(3),
  warranty_days: z.number().int().min(0).max(3650).default(30),
  image_url: z.string().url("A URL da imagem é inválida.").nullable().optional(),
  category_id: z.string().uuid().nullable().optional()
});

export const importGoogleDriveMediaSchema = z.object({
  file_id: z.string().trim().min(1, "Arquivo do Google Drive não informado."),
  access_token: z.string().trim().min(1, "Token do Google Drive não informado."),
  file_name: z.string().trim().min(1).max(255),
  mime_type: z.string().trim().refine(
    (value) => value.startsWith("image/") || value.startsWith("video/"),
    "Selecione um arquivo de imagem ou vídeo válido."
  ),
  alt_text: z.string().trim().max(255).nullable().optional(),
  is_primary: z.boolean().optional().default(false),
  sort_order: z.number().int().min(0).max(10000).optional().default(0)
});

export const updateProductMediaSchema = z.object({
  alt_text: z.string().trim().max(255).nullable().optional(),
  is_primary: z.boolean().optional(),
  sort_order: z.number().int().min(0).max(10000).optional(),
  is_active: z.boolean().optional()
}).refine((value) => Object.keys(value).length > 0, {
  message: "Informe pelo menos um campo para atualizar a mídia."
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type ImportGoogleDriveMediaInput = z.infer<typeof importGoogleDriveMediaSchema>;
export type UpdateProductMediaInput = z.infer<typeof updateProductMediaSchema>;
