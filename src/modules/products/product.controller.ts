import {
  FastifyReply,
  FastifyRequest
} from "fastify";
import { ZodError } from "zod";
import { supabase } from "../../config/supabase";
import { productService } from "./product.service";
import {
  createProductSchema,
  CreateProductInput,
  importGoogleDriveMediaSchema,
  ImportGoogleDriveMediaInput
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

async function requireAuthenticatedUser(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const authorization = request.headers.authorization ?? "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);

  if (!match?.[1]) {
    reply.status(401).send({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Sessão do painel não informada."
      }
    });
    return null;
  }

  const { data, error } = await supabase.auth.getUser(match[1]);

  if (error || !data.user) {
    reply.status(401).send({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Sessão do painel inválida ou expirada."
      }
    });
    return null;
  }

  return data.user;
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

  async importGoogleDriveMedia(
    request: FastifyRequest<{
      Body: ImportGoogleDriveMediaInput;
    }>,
    reply: FastifyReply
  ) {
    try {
      const user = await requireAuthenticatedUser(request, reply);
      if (!user) return;

      const input = importGoogleDriveMediaSchema.parse(request.body);
      const result = await productService.importGoogleDriveMedia(input);

      return reply.status(201).send({
        success: true,
        message: "Imagem importada do Google Drive com sucesso.",
        data: {
          ...result,
          imported_by: user.id
        }
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.status(400).send({
          success: false,
          error: {
            message:
              error.issues[0]?.message ??
              "Os dados da mídia são inválidos.",
            issues: error.issues
          }
        });
      }

      console.error(
        "Erro ao importar mídia do Google Drive:",
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
