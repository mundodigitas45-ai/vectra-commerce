import { FastifyInstance } from "fastify";
import { z } from "zod";
import { supabase } from "../../config/supabase";

const createOrderSchema = z.object({
  customer: z.object({
    name: z.string().min(2),
    phone: z.string().min(10),
    neighborhood: z.string().min(2),
    address: z.string().min(3),
    reference: z.string().optional().nullable()
  }),
  items: z.array(
    z.object({
      product_id: z.string().uuid(),
      quantity: z.number().int().min(1).max(20)
    })
  ).min(1),
  payment_method: z.enum(["pix", "cash"]),
  preferred_delivery_time: z.string().optional().nullable(),
  notes: z.string().optional().nullable()
});

export async function orderRoutes(app: FastifyInstance) {
  app.post("/api/v1/orders", async (request, reply) => {
    const parsed = createOrderSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Dados do pedido inválidos.",
          details: parsed.error.flatten()
        }
      });
    }

    const payload = parsed.data;

    const { data, error } = await supabase.rpc(
      "create_order_with_reservation",
      {
        p_customer: payload.customer,
        p_items: payload.items,
        p_payment_method: payload.payment_method,
        p_preferred_delivery_time:
          payload.preferred_delivery_time ?? null,
        p_notes: payload.notes ?? null
      }
    );

    if (error) {
      const message = error.message ?? "Falha ao criar pedido.";

      let statusCode = 500;
      let code = "ORDER_CREATE_FAILED";

      if (message.includes("DELIVERY_ZONE_NOT_FOUND")) {
        statusCode = 422;
        code = "DELIVERY_ZONE_NOT_FOUND";
      } else if (message.includes("INSUFFICIENT_STOCK")) {
        statusCode = 409;
        code = "INSUFFICIENT_STOCK";
      } else if (message.includes("PRODUCT_NOT_FOUND")) {
        statusCode = 404;
        code = "PRODUCT_NOT_FOUND";
      }

      return reply.status(statusCode).send({
        success: false,
        error: {
          code,
          message
        }
      });
    }

    return reply.status(201).send({
      success: true,
      data
    });
  });
}
