import type {
  FastifyReply,
  FastifyRequest
} from "fastify";

import {
  createOrderSchema,
  orderIdParamsSchema,
  updateOrderStatusSchema,
  type CreateOrderInput,
  type UpdateOrderStatusInput
} from "./order.schemas";

import { orderService } from "./order.service";

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : String(error);
}

function identifyOrderError(message: string) {
  if (message.includes("ORDER_NOT_FOUND")) {
    return {
      status: 404,
      code: "ORDER_NOT_FOUND",
      publicMessage: "Pedido não encontrado."
    };
  }

  if (
    message.includes("ORDER_RESERVATION_EXPIRED") ||
    message.includes("NO_ACTIVE_RESERVATION")
  ) {
    return {
      status: 409,
      code: "ORDER_RESERVATION_EXPIRED",
      publicMessage:
        "A reserva deste pedido expirou. Cancele o pedido e crie um novo."
    };
  }

  if (
    message.includes("INVALID_STATUS_TRANSITION")
  ) {
    return {
      status: 409,
      code: "INVALID_STATUS_TRANSITION",
      publicMessage:
        "Essa mudança de status não é permitida."
    };
  }

  if (
    message.includes("DELIVERY_ZONE_NOT_FOUND")
  ) {
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

  if (
    message.includes("INVALID_PAYMENT_METHOD")
  ) {
    return {
      status: 422,
      code: "INVALID_PAYMENT_METHOD",
      publicMessage:
        "Forma de pagamento inválida."
    };
  }

  return {
    status: 500,
    code: "ORDER_OPERATION_FAILED",
    publicMessage:
      "Não foi possível concluir a operação do pedido."
  };
}

export class OrderController {
  async create(
    request: FastifyRequest<{
      Body: CreateOrderInput;
    }>,
    reply: FastifyReply
  ) {
    const parsed =
      createOrderSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message:
            "Os dados do pedido são inválidos.",
          details: parsed.error.flatten()
        }
      });
    }

    try {
      const order =
        await orderService.create(parsed.data);

      return reply.status(201).send({
        success: true,
        data: order,
        message:
          "Pedido criado e estoque reservado com sucesso."
      });
    } catch (error) {
      request.log.error(error);

      const identified =
        identifyOrderError(
          getErrorMessage(error)
        );

      return reply
        .status(identified.status)
        .send({
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
      const orders =
        await orderService.list();

      return reply.send({
        success: true,
        data: orders
      });
    } catch (error) {
      request.log.error(error);

      return reply.status(500).send({
        success: false,
        error: {
          code: "ORDER_LIST_FAILED",
          message:
            "Não foi possível carregar os pedidos."
        }
      });
    }
  }

  async updateStatus(
    request: FastifyRequest<{
      Params: {
        orderId: string;
      };
      Body: UpdateOrderStatusInput;
    }>,
    reply: FastifyReply
  ) {
    const parsedParams =
      orderIdParamsSchema.safeParse(
        request.params
      );

    if (!parsedParams.success) {
      return reply.status(400).send({
        success: false,
        error: {
          code: "INVALID_ORDER_ID",
          message:
            "O identificador do pedido é inválido.",
          details:
            parsedParams.error.flatten()
        }
      });
    }

    const parsedBody =
      updateOrderStatusSchema.safeParse(
        request.body
      );

    if (!parsedBody.success) {
      return reply.status(400).send({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message:
            "O novo status do pedido é inválido.",
          details:
            parsedBody.error.flatten()
        }
      });
    }

    try {
      const order =
        await orderService.updateStatus(
          parsedParams.data.orderId,
          parsedBody.data
        );

      // =====================================================
      // META PURCHASE OUTBOX
      //
      // Regra:
      // - somente delivered
      // - enqueue idempotente no banco
      // - falha de tracking NUNCA desfaz a entrega
      // - pedidos legados sem site_id são ignorados
      // =====================================================

      if (
        parsedBody.data.status ===
        "delivered"
      ) {
        try {
          const outboxId =
            await orderService
              .enqueueMetaPurchase(
                parsedParams.data.orderId
              );

          request.log.info(
            {
              orderId:
                parsedParams.data.orderId,
              outboxId
            },
            "Meta Purchase enfileirado."
          );
        } catch (trackingError) {
          request.log.warn(
            {
              orderId:
                parsedParams.data.orderId,
              error:
                getErrorMessage(
                  trackingError
                )
            },
            "Pedido entregue, mas o Meta Purchase não pôde ser enfileirado."
          );
        }
      }

      // =====================================================
      // NOTIFICAÇÃO DE STATUS -> N8N
      // A falha do webhook não pode impedir a atualização
      // normal do pedido.
      // =====================================================

      const webhookUrl =
        process.env.ORDER_STATUS_WEBHOOK_URL;

      const status =
        parsedBody.data.status;

      const statusesToNotify = new Set([
        "confirmed",
        "preparing",
        "dispatched",
        "delivered"
      ]);

      if (
        webhookUrl &&
        statusesToNotify.has(status)
      ) {
        try {
          const webhookResponse = await fetch(
            webhookUrl,
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json"
              },
              body: JSON.stringify({
                order_id:
                  parsedParams.data.orderId,
                status,
                reason:
                  parsedBody.data.reason ?? ""
              }),
              signal:
                AbortSignal.timeout(5000)
            }
          );

          if (!webhookResponse.ok) {
            request.log.warn(
              {
                orderId:
                  parsedParams.data.orderId,
                status,
                webhookStatus:
                  webhookResponse.status
              },
              "Webhook de status do pedido retornou erro."
            );
          }
        } catch (webhookError) {
          request.log.warn(
            {
              orderId:
                parsedParams.data.orderId,
              status,
              error:
                getErrorMessage(
                  webhookError
                )
            },
            "Não foi possível enviar a atualização de status ao n8n."
          );
        }
      }

      return reply.send({
        success: true,
        message:
          "Status do pedido atualizado com sucesso.",
        data: order
      });
    } catch (error) {
      request.log.error(error);

      const identified =
        identifyOrderError(
          getErrorMessage(error)
        );

      return reply
        .status(identified.status)
        .send({
          success: false,
          error: {
            code: identified.code,
            message:
              identified.publicMessage
          }
        });
    }
  }
}

export const orderController =
  new OrderController();
