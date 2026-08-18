import type {
  FastifyReply,
  FastifyRequest
} from "fastify";

import {
  createSiteSchema,
  type CreateSiteInput
} from "./site.schemas";

import { siteService } from "./site.service";

function canManageSites(
  role: string | undefined
): boolean {
  return role === "owner" ||
    role === "admin";
}

export class SiteController {
  async list(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    const context =
      request.authContext;

    if (!context) {
      return reply.status(500).send({
        success: false,
        error: {
          code: "COMPANY_CONTEXT_MISSING",
          message:
            "Não foi possível identificar a empresa ativa."
        }
      });
    }

    try {
      const sites =
        await siteService.list(
          context.companyId
        );

      return reply.send({
        success: true,
        data: sites
      });
    } catch (error) {
      request.log.error(error);

      return reply.status(500).send({
        success: false,
        error: {
          code: "SITES_LOAD_FAILED",
          message:
            "Não foi possível carregar os sites."
        }
      });
    }
  }

  async create(
    request: FastifyRequest<{
      Body: CreateSiteInput;
    }>,
    reply: FastifyReply
  ) {
    const context =
      request.authContext;

    if (!context) {
      return reply.status(500).send({
        success: false,
        error: {
          code: "COMPANY_CONTEXT_MISSING",
          message:
            "Não foi possível identificar a empresa ativa."
        }
      });
    }

    if (!canManageSites(context.role)) {
      return reply.status(403).send({
        success: false,
        error: {
          code: "SITE_MANAGE_FORBIDDEN",
          message:
            "Seu usuário não possui permissão para gerenciar sites."
        }
      });
    }

    const parsed =
      createSiteSchema.safeParse(
        request.body
      );

    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message:
            "Os dados do site são inválidos.",
          details:
            parsed.error.flatten()
        }
      });
    }

    try {
      const site =
        await siteService.create(
          context.companyId,
          parsed.data
        );

      return reply.status(201).send({
        success: true,
        message:
          "Site cadastrado com sucesso.",
        data: site
      });
    } catch (error: any) {
      request.log.error(error);

      if (error?.code === "23505") {
        return reply.status(409).send({
          success: false,
          error: {
            code: "SITE_ALREADY_EXISTS",
            message:
              "Já existe um site com este domínio ou identificação nesta empresa."
          }
        });
      }

      if (
        error?.code ===
        "STORE_ACCESS_DENIED"
      ) {
        return reply.status(403).send({
          success: false,
          error: {
            code:
              "STORE_ACCESS_DENIED",
            message: error.message
          }
        });
      }

      if (
        error?.code ===
        "INVALID_DOMAIN"
      ) {
        return reply.status(400).send({
          success: false,
          error: {
            code: "INVALID_DOMAIN",
            message: error.message
          }
        });
      }

      return reply.status(500).send({
        success: false,
        error: {
          code: "SITE_CREATE_FAILED",
          message:
            "Não foi possível cadastrar o site."
        }
      });
    }
  }
}

export const siteController =
  new SiteController();
