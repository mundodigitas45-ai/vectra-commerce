import type {
  FastifyReply,
  FastifyRequest
} from "fastify";

import {
  createOrderSchema,
  type CreateOrderInput
} from "./order.schemas";

import { orderService } from "./order.service";

function identifyOrderError(message: string) {
  if (message.includes("DELIVERY_ZONE_NOT_FOUND")) {
    return {
      status: 422,
      code: "DELIVERY_ZONE_NOT_FOUND",
      publicMessage:
        "O bairro informado ainda não possui taxa cadastrada."
    };
  }

  if (message.includes("INSUFFICIENT_STOCK")) {
    return {
      status: 409,
      code: "INSUFFICIENT_STOCK",
      publicMessage:
        "Não há estoque disponível para essa quantidade."
    };
  }

  if (message.includes("PRODUCT_NOT_FOUND")) {
    return {
      status: 404,
      code: "PRODUCT_NOT_FOUND",
      publicMessage: "Produto não encontrado."
    };
  }

  if (message.includes("INVALID_PAYMENT_METHOD")) {
    return {
      status: 422,
      code: "INVALID_PAYMENT_METHOD",
      publicMessage: "Forma de pagamento inválida."
    };
  }

  return {
    status: 500,
    code: "ORDER_CREATE_FAILED",
    publicMessage: "Não foi possível processar o pedido."
  };
}

export class OrderController {
  async create(
    request: FastifyRequest<{
      Body: CreateOrderInput;
    }>,
    reply: FastifyReply
  ) {
    const parsed = createOrderSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Os dados do pedido são inválidos.",
          details: parsed.error.flatten()
        }
      });
    }

    try {
      const order = await orderService.create(parsed.data);

      return reply.status(201).send({
        success: true,
        data: order,
        message:
          "Pedido criado e estoque reservado com sucesso."
      });
    } catch (error) {
      request.log.error(error);

      const message =
        error instanceof Error
          ? error.message
          : String(error);

      const identified = identifyOrderError(message);

      return reply.status(identified.status).send({
        success: false,
        error: {
          code: identified.code,
          message: identified.publicMessage
        }
      });
    }
  }

  async list(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      const orders = await orderService.list();

      return reply.status(200).send({
        success: true,
        data: orders
      });
    } catch (error) {
      request.log.error(error);

      return reply.status(500).send({
        success: false,
        error: {
          code: "ORDER_LIST_FAILED",
          message: "Não foi possível carregar os pedidos."
        }
      });
    }
  }
}

export const orderController = new OrderController();