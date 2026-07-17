import {
  FastifyReply,
  FastifyRequest
} from "fastify";
import { ZodError } from "zod";
import { productService } from "./product.service";
import {
  createProductSchema,
  CreateProductInput
} from "./product.schemas";

function getErrorMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Não foi possível cadastrar o produto.";
}

export class ProductController {
  async list(
    _request: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      const products = await productService.list();

      return reply.send({
        success: true,
        data: products
      });
    } catch (error) {
      console.error("Erro ao listar produtos:", error);

      return reply.status(500).send({
        success: false,
        error: {
          message: getErrorMessage(error)
        }
      });
    }
  }

  async create(
    request: FastifyRequest<{
      Body: CreateProductInput;
    }>,
    reply: FastifyReply
  ) {
    try {
      const input = createProductSchema.parse(
        request.body
      );

      const result = await productService.create(input);

      return reply.status(201).send({
        success: true,
        message: "Produto cadastrado com sucesso.",
        data: result
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.status(400).send({
          success: false,
          error: {
            message:
              error.issues[0]?.message ??
              "Os dados do produto são inválidos.",
            issues: error.issues
          }
        });
      }

      console.error(
        "Erro detalhado ao criar produto:",
        error
      );

      return reply.status(500).send({
        success: false,
        error: {
          message: getErrorMessage(error)
        }
      });
    }
  }
}

export const productController =
  new ProductController();