import type {
  FastifyReply,
  FastifyRequest
} from "fastify";

import { deliveryZoneService } from "./delivery-zone.service";

import {
  createDeliveryZoneSchema,
  deliveryZoneParamsSchema,
  updateDeliveryZoneSchema,
  updateDeliveryZoneStatusSchema,
  type CreateDeliveryZoneInput,
  type UpdateDeliveryZoneInput,
  type UpdateDeliveryZoneStatusInput
} from "./delivery-zone.schemas";

interface DeliveryZoneParams {
  zoneId: string;
}

function handleDeliveryZoneError(
  reply: FastifyReply,
  error: unknown
) {
  const message =
    error instanceof Error
      ? error.message
      : String(error);

  if (
    message.includes(
      "DELIVERY_ZONE_NOT_FOUND"
    )
  ) {
    return reply.status(404).send({
      success: false,
      error: {
        code: "DELIVERY_ZONE_NOT_FOUND",
        message:
          "Bairro ou região não encontrado."
      }
    });
  }

  if (
    message.includes(
      "DELIVERY_ZONE_ALREADY_EXISTS"
    ) ||
    message.toLowerCase().includes("duplicate") ||
    message.toLowerCase().includes("unique")
  ) {
    return reply.status(409).send({
      success: false,
      error: {
        code:
          "DELIVERY_ZONE_ALREADY_EXISTS",
        message:
          "Já existe um bairro com esse nome normalizado."
      }
    });
  }

  if (
    message.includes(
      "INVALID_DELIVERY_FEE"
    )
  ) {
    return reply.status(400).send({
      success: false,
      error: {
        code: "INVALID_DELIVERY_FEE",
        message:
          "A taxa deve ser R$ 0, R$ 10, R$ 15 ou R$ 20."
      }
    });
  }

  return reply.status(500).send({
    success: false,
    error: {
      code:
        "DELIVERY_ZONE_OPERATION_FAILED",
      message:
        "Não foi possível concluir a operação do bairro.",
      technical_message: message
    }
  });
}

export class DeliveryZoneController {
  async list(
    _request: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      const zones =
        await deliveryZoneService.list();

      return reply.send({
        success: true,
        data: zones
      });
    } catch (error) {
      return handleDeliveryZoneError(
        reply,
        error
      );
    }
  }

  async getById(
    request: FastifyRequest<{
      Params: DeliveryZoneParams;
    }>,
    reply: FastifyReply
  ) {
    const params =
      deliveryZoneParamsSchema.safeParse(
        request.params
      );

    if (!params.success) {
      return reply.status(400).send({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message:
            "O identificador do bairro é inválido.",
          details:
            params.error.flatten()
        }
      });
    }

    try {
      const zone =
        await deliveryZoneService.findById(
          params.data.zoneId
        );

      return reply.send({
        success: true,
        data: zone
      });
    } catch (error) {
      return handleDeliveryZoneError(
        reply,
        error
      );
    }
  }

  async create(
    request: FastifyRequest<{
      Body: CreateDeliveryZoneInput;
    }>,
    reply: FastifyReply
  ) {
    const parsed =
      createDeliveryZoneSchema.safeParse(
        request.body
      );

    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message:
            "Os dados do bairro são inválidos.",
          details:
            parsed.error.flatten()
        }
      });
    }

    try {
      const zone =
        await deliveryZoneService.create(
          parsed.data
        );

      return reply.status(201).send({
        success: true,
        message:
          "Bairro criado com sucesso.",
        data: zone
      });
    } catch (error) {
      return handleDeliveryZoneError(
        reply,
        error
      );
    }
  }

  async update(
    request: FastifyRequest<{
      Params: DeliveryZoneParams;
      Body: UpdateDeliveryZoneInput;
    }>,
    reply: FastifyReply
  ) {
    const params =
      deliveryZoneParamsSchema.safeParse(
        request.params
      );

    const body =
      updateDeliveryZoneSchema.safeParse(
        request.body
      );

    if (!params.success || !body.success) {
      return reply.status(400).send({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message:
            "Os dados da edição são inválidos.",
          details: {
            params: params.success
              ? null
              : params.error.flatten(),
            body: body.success
              ? null
              : body.error.flatten()
          }
        }
      });
    }

    try {
      const zone =
        await deliveryZoneService.update(
          params.data.zoneId,
          body.data
        );

      return reply.send({
        success: true,
        message:
          "Bairro atualizado com sucesso.",
        data: zone
      });
    } catch (error) {
      return handleDeliveryZoneError(
        reply,
        error
      );
    }
  }

  async updateStatus(
    request: FastifyRequest<{
      Params: DeliveryZoneParams;
      Body: UpdateDeliveryZoneStatusInput;
    }>,
    reply: FastifyReply
  ) {
    const params =
      deliveryZoneParamsSchema.safeParse(
        request.params
      );

    const body =
      updateDeliveryZoneStatusSchema.safeParse(
        request.body
      );

    if (!params.success || !body.success) {
      return reply.status(400).send({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message:
            "O status informado é inválido."
        }
      });
    }

    try {
      const zone =
        await deliveryZoneService.updateStatus(
          params.data.zoneId,
          body.data.is_active
        );

      return reply.send({
        success: true,
        message: body.data.is_active
          ? "Bairro ativado com sucesso."
          : "Bairro desativado com sucesso.",
        data: zone
      });
    } catch (error) {
      return handleDeliveryZoneError(
        reply,
        error
      );
    }
  }
}

export const deliveryZoneController =
  new DeliveryZoneController();
