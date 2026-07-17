import { z } from "zod";

export const createStockMovementSchema = z.object({
  product_id: z
    .string()
    .uuid("O ID do produto é inválido."),

  movement_type: z.enum([
    "entry",
    "exit",
    "adjustment"
  ]),

  quantity: z
    .number()
    .int()
    .min(1, "A quantidade mínima é 1.")
    .max(100000),

  adjustment_direction: z
    .enum(["increase", "decrease"])
    .nullable()
    .optional(),

  reason: z
    .string()
    .trim()
    .min(2, "Informe o motivo da movimentação.")
    .max(300),

  notes: z
    .string()
    .trim()
    .max(500)
    .nullable()
    .optional()
}).superRefine((input, context) => {
  if (
    input.movement_type === "adjustment" &&
    !input.adjustment_direction
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["adjustment_direction"],
      message:
        "Informe se o ajuste aumenta ou diminui o estoque."
    });
  }
});

export type CreateStockMovementInput = z.infer<
  typeof createStockMovementSchema
>;