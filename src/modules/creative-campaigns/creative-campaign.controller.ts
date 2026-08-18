import type {
  FastifyReply,
  FastifyRequest
} from "fastify";
import {
  createCreativeCampaignSchema,
  requestCreativeGenerationSchema,
  type CreateCreativeCampaignInput,
  type RequestCreativeGenerationInput
} from "./creative-campaign.schemas";
import { creativeCampaignService } from "./creative-campaign.service";

interface CampaignParams {
  campaignId: string;
}

function canManageCreatives(
  role: string | undefined
): boolean {
  return Boolean(role) && role !== "viewer";
}

function missingContext(reply: FastifyReply) {
  return reply.status(500).send({
    success: false,
    error: {
      code: "COMPANY_CONTEXT_MISSING",
      message:
        "Não foi possível identificar a empresa ativa."
    }
  });
}

export class CreativeCampaignController {
  async list(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    const context = request.authContext;
    if (!context) return missingContext(reply);

    try {
      const campaigns =
        await creativeCampaignService.list(
          context.companyId
        );

      return reply.send({
        success: true,
        data: campaigns
      });
    } catch (error) {
      request.log.error(error);

      return reply.status(500).send({
        success: false,
        error: {
          code: "CREATIVE_CAMPAIGNS_LOAD_FAILED",
          message:
            "Não foi possível carregar as campanhas."
        }
      });
    }
  }

  async getById(
    request: FastifyRequest<{
      Params: CampaignParams;
    }>,
    reply: FastifyReply
  ) {
    const context = request.authContext;
    if (!context) return missingContext(reply);

    try {
      const campaign =
        await creativeCampaignService.getById(
          context.companyId,
          request.params.campaignId
        );

      if (!campaign) {
        return reply.status(404).send({
          success: false,
          error: {
            code: "CAMPAIGN_NOT_FOUND",
            message: "Campanha não encontrada."
          }
        });
      }

      return reply.send({
        success: true,
        data: campaign
      });
    } catch (error) {
      request.log.error(error);

      return reply.status(500).send({
        success: false,
        error: {
          code: "CREATIVE_CAMPAIGN_LOAD_FAILED",
          message:
            "Não foi possível carregar a campanha."
        }
      });
    }
  }

  async create(
    request: FastifyRequest<{
      Body: CreateCreativeCampaignInput;
    }>,
    reply: FastifyReply
  ) {
    const context = request.authContext;
    if (!context) return missingContext(reply);

    if (!canManageCreatives(context.role)) {
      return reply.status(403).send({
        success: false,
        error: {
          code: "CREATIVE_MANAGE_FORBIDDEN",
          message:
            "Seu usuário não possui permissão para criar campanhas."
        }
      });
    }

    const parsed =
      createCreativeCampaignSchema.safeParse(
        request.body
      );

    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message:
            "Os dados da campanha são inválidos.",
          details: parsed.error.flatten()
        }
      });
    }

    try {
      const campaign =
        await creativeCampaignService.create(
          context.companyId,
          context.userId,
          parsed.data
        );

      return reply.status(201).send({
        success: true,
        message: "Campanha criada com sucesso.",
        data: campaign
      });
    } catch (error: any) {
      request.log.error(error);

      if (error?.code === "PRODUCT_ACCESS_DENIED") {
        return reply.status(403).send({
          success: false,
          error: {
            code: error.code,
            message: error.message
          }
        });
      }

      return reply.status(500).send({
        success: false,
        error: {
          code: "CREATIVE_CAMPAIGN_CREATE_FAILED",
          message:
            "Não foi possível criar a campanha."
        }
      });
    }
  }

  async generate(
    request: FastifyRequest<{
      Params: CampaignParams;
      Body: RequestCreativeGenerationInput;
    }>,
    reply: FastifyReply
  ) {
    const context = request.authContext;
    if (!context) return missingContext(reply);

    if (!canManageCreatives(context.role)) {
      return reply.status(403).send({
        success: false,
        error: {
          code: "CREATIVE_MANAGE_FORBIDDEN",
          message:
            "Seu usuário não possui permissão para gerar campanhas."
        }
      });
    }

    const parsed =
      requestCreativeGenerationSchema.safeParse(
        request.body ?? {}
      );

    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message:
            "A solicitação de geração é inválida.",
          details: parsed.error.flatten()
        }
      });
    }

    try {
      const result =
        await creativeCampaignService.enqueueGeneration(
          context.companyId,
          context.userId,
          request.params.campaignId,
          parsed.data
        );

      return reply.status(
        result.reused ? 200 : 202
      ).send({
        success: true,
        message: result.reused
          ? "Já existe uma geração em andamento."
          : "Campanha enviada para geração.",
        data: result
      });
    } catch (error: any) {
      request.log.error(error);

      if (error?.code === "CAMPAIGN_NOT_FOUND") {
        return reply.status(404).send({
          success: false,
          error: {
            code: error.code,
            message: error.message
          }
        });
      }

      return reply.status(500).send({
        success: false,
        error: {
          code: "CREATIVE_GENERATION_QUEUE_FAILED",
          message:
            "Não foi possível iniciar a geração."
        }
      });
    }
  }
}

export const creativeCampaignController =
  new CreativeCampaignController();
