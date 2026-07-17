import type {
  FastifyReply,
  FastifyRequest
} from "fastify";
import { ZodError } from "zod";
import { inventoryService } from "./inventory.service";
import {
  createStockMovementSchema,
  type CreateStockMovementInput
} from "./inventory.schemas";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "Não foi possível realizar a movimentação.";
}

export class InventoryController {
  async listMovements(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      const movements =
        await inventoryService.listMovements();

      return reply.send({
        success: true,
        data: movements
      });
    } catch (error) {
      request.log.error(error);

      return reply.status(500).send({
        success: false,
        error: {
          code: "STOCK_MOVEMENT_LIST_FAILED",
          message: getErrorMessage(error)
        }
      });
    }
  }

  async createMovement(
    request: FastifyRequest<{
      Body: CreateStockMovementInput;
    }>,
    reply: FastifyReply
  ) {
    try {
      const input =
        createStockMovementSchema.parse(request.body);

      const result =
        await inventoryService.createMovement(input);

      return reply.status(201).send({
        success: true,
        message:
          "Movimentação de estoque registrada com sucesso.",
        data: result
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.status(400).send({
          success: false,
          error: {
            code: "INVALID_STOCK_MOVEMENT",
            message:
              error.issues[0]?.message ??
              "Os dados da movimentação são inválidos.",
            issues: error.issues
          }
        });
      }

      const message = getErrorMessage(error);

      request.log.error(error);

      const statusCode =
        message.includes("Estoque insuficiente") ||
        message.includes("unidades reservadas")
          ? 409
          : 500;

      return reply.status(statusCode).send({
        success: false,
        error: {
          code:
            statusCode === 409
              ? "INSUFFICIENT_STOCK"
              : "STOCK_MOVEMENT_FAILED",
          message
        }
      });
    }
  }
}

export const inventoryController =
  new InventoryController();