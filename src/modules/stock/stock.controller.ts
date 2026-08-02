import type { FastifyReply, FastifyRequest } from "fastify";
import {
  stockAdjustmentSchema,
  stockEntrySchema,
  stockRemovalSchema,
  type StockAdjustmentInput,
  type StockEntryInput,
  type StockRemovalInput,
} from "./stock.schemas";
import { stockService } from "./stock.service";

function actorEmail(request: FastifyRequest) {
  return request.adminEmail
    ?? "administrador-nao-identificado";
}

function errorResponse(reply: FastifyReply, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes("INVENTORY_NOT_FOUND")) {
    return reply.status(404).send({
      success: false,
      message: "Inventário não encontrado.",
    });
  }

  if (message.includes("INSUFFICIENT_AVAILABLE_STOCK")) {
    return reply.status(409).send({
      success: false,
      message: "A saída é maior que o estoque disponível.",
    });
  }

  if (message.includes("NEW_STOCK_BELOW_RESERVED")) {
    return reply.status(409).send({
      success: false,
      message: "O novo saldo não pode ser menor que a quantidade reservada.",
    });
  }

  if (message.includes("NO_STOCK_CHANGE")) {
    return reply.status(409).send({
      success: false,
      message: "O novo saldo é igual ao saldo atual.",
    });
  }

  return reply.status(500).send({
    success: false,
    message: "Não foi possível movimentar o estoque.",
    detail: message,
  });
}

export class StockController {
  async entry(
    request: FastifyRequest<{ Body: StockEntryInput }>,
    reply: FastifyReply
  ) {
    const parsed = stockEntrySchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        message: "Dados de entrada inválidos.",
        details: parsed.error.flatten(),
      });
    }

    try {
      const data = await stockService.entry(
        parsed.data,
        actorEmail(request)
      );

      return reply.status(201).send({
        success: true,
        message: "Entrada de estoque registrada.",
        data,
      });
    } catch (error) {
      return errorResponse(reply, error);
    }
  }

  async removal(
    request: FastifyRequest<{ Body: StockRemovalInput }>,
    reply: FastifyReply
  ) {
    const parsed = stockRemovalSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        message: "Dados de saída inválidos.",
        details: parsed.error.flatten(),
      });
    }

    try {
      const data = await stockService.removal(
        parsed.data,
        actorEmail(request)
      );

      return reply.status(201).send({
        success: true,
        message: "Saída de estoque registrada.",
        data,
      });
    } catch (error) {
      return errorResponse(reply, error);
    }
  }

  async adjustment(
    request: FastifyRequest<{ Body: StockAdjustmentInput }>,
    reply: FastifyReply
  ) {
    const parsed = stockAdjustmentSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        message: "Dados de ajuste inválidos.",
        details: parsed.error.flatten(),
      });
    }

    try {
      const data = await stockService.adjustment(
        parsed.data,
        actorEmail(request)
      );

      return reply.status(201).send({
        success: true,
        message: "Ajuste de estoque registrado.",
        data,
      });
    } catch (error) {
      return errorResponse(reply, error);
    }
  }
}

export const stockController = new StockController();
