import { z } from "zod";

export const createOrderSchema = z.object({
  customer: z.object({
    name: z
      .string()
      .trim()
      .min(2, "O nome precisa ter pelo menos 2 caracteres.")
      .max(120),

    phone: z
      .string()
      .trim()
      .min(10, "O telefone precisa ter pelo menos 10 números.")
      .max(20),

    neighborhood: z
      .string()
      .trim()
      .min(2, "Informe o bairro.")
      .max(120),

    address: z
      .string()
      .trim()
      .min(3, "Informe o endereço.")
      .max(250),

    reference: z
      .string()
      .trim()
      .max(250)
      .nullable()
      .optional()
  }),

  items: z
    .array(
      z.object({
        product_id: z
          .string()
          .uuid("O ID do produto é inválido."),

        quantity: z
          .number()
          .int()
          .min(1, "A quantidade mínima é 1.")
          .max(20, "A quantidade máxima é 20.")
      })
    )
    .min(1, "O pedido precisa ter pelo menos um produto.")
    .max(20),

  payment_method: z.enum(["pix", "cash"]),

  preferred_delivery_time: z
    .string()
    .trim()
    .max(100)
    .nullable()
    .optional(),

  notes: z
    .string()
    .trim()
    .max(500)
    .nullable()
    .optional()
});

export type CreateOrderInput = z.infer<
  typeof createOrderSchema
>;
