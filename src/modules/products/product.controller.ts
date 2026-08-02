import type {
  FastifyReply,
  FastifyRequest
} from "fastify";

import { productService } from "./product.service";
import {
  createProductSchema,
  updateProductSchema,
  updateProductStatusSchema,
  type CreateProductInput,
  type UpdateProductInput,
  type UpdateProductStatusInput
} from "./product.schemas";

interface ProductParams {
  productId: string;
}

function productError(
  reply: FastifyReply,
  error: unknown
) {
  const message =
    error instanceof Error
      ? error.message
      : String(error);

  if (message.includes("PRODUCT_NOT_FOUND")) {
    return reply.status(404).send({
      success: false,
      error: {
        code: "PRODUCT_NOT_FOUND",
        message: "Produto não encontrado."
      }
    });
  }

  if (
    message.includes("duplicate") ||
    message.includes("unique") ||
    message.includes("PRODUCT_SLUG_ALREADY_EXISTS")
  ) {
    return reply.status(409).send({
      success: false,
      error: {
        code: "PRODUCT_SLUG_ALREADY_EXISTS",
        message:
          "Já existe um produto com esse identificador."
      }
    });
  }

  if (message.includes("INVALID_MAXIMUM_QUANTITY")) {
    return reply.status(400).send({
      success: false,
      error: {
        code: "INVALID_MAXIMUM_QUANTITY",
        message:
          "O estoque máximo não pode ser menor que o mínimo."
      }
    });
  }

  return reply.status(500).send({
    success: false,
    error: {
      code: "PRODUCT_OPERATION_FAILED",
      message:
        "Não foi possível concluir a operação do produto."
    }
  });
}

export class ProductController {
  async list(
    _request: FastifyRequest,
    reply: FastifyReply
  ) {
    const products = await productService.list();

    return reply.send({
      success: true,
      data: products
    });
  }

  async getById(
    request: FastifyRequest<{
      Params: ProductParams;
    }>,
    reply: FastifyReply
  ) {
    try {
      const product =
        await productService.findById(
          request.params.productId
        );

      if (!product) {
        return reply.status(404).send({
          success: false,
          error: {
            code: "PRODUCT_NOT_FOUND",
            message: "Produto não encontrado."
          }
        });
      }

      return reply.send({
        success: true,
        data: product
      });
    } catch (error) {
      return productError(reply, error);
    }
  }

  async create(
    request: FastifyRequest<{
      Body: CreateProductInput;
    }>,
    reply: FastifyReply
  ) {
    const parsed =
      createProductSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message:
            "Os dados do produto são inválidos.",
          details: parsed.error.flatten()
        }
      });
    }

    try {
      const data = await productService.create(
        parsed.data,
        request.adminEmail ??
          "administrador-nao-identificado"
      );

      return reply.status(201).send({
        success: true,
        message: "Produto criado com sucesso.",
        data
      });
    } catch (error) {
      return productError(reply, error);
    }
  }

  async update(
    request: FastifyRequest<{
      Params: ProductParams;
      Body: UpdateProductInput;
    }>,
    reply: FastifyReply
  ) {
    const parsed =
      updateProductSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message:
            "Os dados da edição são inválidos.",
          details: parsed.error.flatten()
        }
      });
    }

    try {
      const data = await productService.update(
        request.params.productId,
        parsed.data
      );

      return reply.send({
        success: true,
        message: "Produto atualizado com sucesso.",
        data
      });
    } catch (error) {
      return productError(reply, error);
    }
  }

  async updateStatus(
    request: FastifyRequest<{
      Params: ProductParams;
      Body: UpdateProductStatusInput;
    }>,
    reply: FastifyReply
  ) {
    const parsed =
      updateProductStatusSchema.safeParse(
        request.body
      );

    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message:
            "O status informado é inválido.",
          details: parsed.error.flatten()
        }
      });
    }

    try {
      const data =
        await productService.updateStatus(
          request.params.productId,
          parsed.data.is_active
        );

      return reply.send({
        success: true,
        message: parsed.data.is_active
          ? "Produto ativado com sucesso."
          : "Produto desativado com sucesso.",
        data
      });
    } catch (error) {
      return productError(reply, error);
    }
  }
}

export const productController =
  new ProductController();
