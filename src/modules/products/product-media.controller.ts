import { FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";
import { supabase } from "../../config/supabase";
import {
  importGoogleDriveMediaSchema,
  ImportGoogleDriveMediaInput,
  updateProductMediaSchema,
  UpdateProductMediaInput
} from "./product.schemas";
import { productMediaService } from "./product-media.service";

async function requireAuthenticatedUser(request: FastifyRequest, reply: FastifyReply) {
  const authorization = request.headers.authorization ?? "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);

  if (!match?.[1]) {
    reply.status(401).send({ success: false, error: { code: "UNAUTHORIZED", message: "Sessão do painel não informada." } });
    return null;
  }

  const { data, error } = await supabase.auth.getUser(match[1]);
  if (error || !data.user) {
    reply.status(401).send({ success: false, error: { code: "UNAUTHORIZED", message: "Sessão do painel inválida ou expirada." } });
    return null;
  }

  return data.user;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Não foi possível concluir a operação de mídia.";
}

export class ProductMediaController {
  async list(
    request: FastifyRequest<{ Params: { productId: string } }>,
    reply: FastifyReply
  ) {
    const user = await requireAuthenticatedUser(request, reply);
    if (!user) return;

    try {
      const data = await productMediaService.list(request.params.productId);
      return reply.send({ success: true, data });
    } catch (error) {
      return reply.status(500).send({ success: false, error: { message: errorMessage(error) } });
    }
  }

  async importGoogleDrive(
    request: FastifyRequest<{ Params: { productId: string }; Body: ImportGoogleDriveMediaInput }>,
    reply: FastifyReply
  ) {
    const user = await requireAuthenticatedUser(request, reply);
    if (!user) return;

    try {
      const input = importGoogleDriveMediaSchema.parse(request.body);
      const data = await productMediaService.importGoogleDrive(request.params.productId, input);
      return reply.status(201).send({ success: true, message: "Mídia vinculada ao produto com sucesso.", data });
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.status(400).send({ success: false, error: { message: error.issues[0]?.message ?? "Dados de mídia inválidos.", issues: error.issues } });
      }
      return reply.status(500).send({ success: false, error: { message: errorMessage(error) } });
    }
  }

  async update(
    request: FastifyRequest<{ Params: { productId: string; mediaId: string }; Body: UpdateProductMediaInput }>,
    reply: FastifyReply
  ) {
    const user = await requireAuthenticatedUser(request, reply);
    if (!user) return;

    try {
      const input = updateProductMediaSchema.parse(request.body);
      const data = await productMediaService.update(request.params.productId, request.params.mediaId, input);
      return reply.send({ success: true, message: "Mídia atualizada com sucesso.", data });
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.status(400).send({ success: false, error: { message: error.issues[0]?.message ?? "Dados de mídia inválidos.", issues: error.issues } });
      }
      return reply.status(500).send({ success: false, error: { message: errorMessage(error) } });
    }
  }

  async remove(
    request: FastifyRequest<{ Params: { productId: string; mediaId: string } }>,
    reply: FastifyReply
  ) {
    const user = await requireAuthenticatedUser(request, reply);
    if (!user) return;

    try {
      const data = await productMediaService.remove(request.params.productId, request.params.mediaId);
      return reply.send({ success: true, message: "Mídia removida com sucesso.", data });
    } catch (error) {
      return reply.status(500).send({ success: false, error: { message: errorMessage(error) } });
    }
  }
}

export const productMediaController = new ProductMediaController();
