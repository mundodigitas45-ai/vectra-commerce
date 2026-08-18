import type {
  FastifyReply,
  FastifyRequest
} from "fastify";

import {
  createSiteIntegrationSchema,
  updateSiteIntegrationSchema,
  setMetaCapiSecretSchema,
  type CreateSiteIntegrationInput,
  type UpdateSiteIntegrationInput,
  type SetMetaCapiSecretInput
} from "./site-integration.schemas";

import {
  siteIntegrationService
} from "./site-integration.service";

function canManageIntegrations(
  role: string | undefined
): boolean {
  return role === "owner" ||
    role === "admin";
}

function contextOrReply(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const context =
    request.authContext;

  if (!context) {
    reply.status(500).send({
      success: false,
      error: {
        code:
          "COMPANY_CONTEXT_MISSING",
        message:
          "Não foi possível identificar a empresa ativa."
      }
    });

    return null;
  }

  return context;
}

export class SiteIntegrationController {
  async list(
    request: FastifyRequest<{
      Params: {
        siteId: string;
      };
    }>,
    reply: FastifyReply
  ) {
    const context =
      contextOrReply(
        request,
        reply
      );

    if (!context) return;

    try {
      const data =
        await siteIntegrationService.list(
          context.companyId,
          request.params.siteId
        );

      return reply.send({
        success: true,
        data
      });
    } catch (error: any) {
      request.log.error(error);

      if (
        error?.code ===
        "SITE_NOT_FOUND"
      ) {
        return reply.status(404).send({
          success: false,
          error: {
            code: "SITE_NOT_FOUND",
            message: error.message
          }
        });
      }

      return reply.status(500).send({
        success: false,
        error: {
          code:
            "SITE_INTEGRATIONS_LOAD_FAILED",
          message:
            "Não foi possível carregar as integrações do site."
        }
      });
    }
  }

  async create(
    request: FastifyRequest<{
      Params: {
        siteId: string;
      };
      Body:
        CreateSiteIntegrationInput;
    }>,
    reply: FastifyReply
  ) {
    const context =
      contextOrReply(
        request,
        reply
      );

    if (!context) return;

    if (
      !canManageIntegrations(
        context.role
      )
    ) {
      return reply.status(403).send({
        success: false,
        error: {
          code:
            "INTEGRATION_MANAGE_FORBIDDEN",
          message:
            "Seu usuário não possui permissão para gerenciar integrações."
        }
      });
    }

    const parsed =
      createSiteIntegrationSchema.safeParse(
        request.body
      );

    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message:
            "Os dados da integração são inválidos.",
          details:
            parsed.error.flatten()
        }
      });
    }

    try {
      const data =
        await siteIntegrationService.create(
          context.companyId,
          request.params.siteId,
          parsed.data
        );

      return reply.status(201).send({
        success: true,
        message:
          "Integração conectada com sucesso.",
        data
      });
    } catch (error: any) {
      request.log.error(error);

      if (
        error?.code ===
        "23505"
      ) {
        return reply.status(409).send({
          success: false,
          error: {
            code:
              "INTEGRATION_ALREADY_EXISTS",
            message:
              "Este site já possui uma integração Meta Pixel."
          }
        });
      }

      if (
        error?.code ===
        "SITE_NOT_FOUND"
      ) {
        return reply.status(404).send({
          success: false,
          error: {
            code: "SITE_NOT_FOUND",
            message: error.message
          }
        });
      }

      return reply.status(500).send({
        success: false,
        error: {
          code:
            "SITE_INTEGRATION_CREATE_FAILED",
          message:
            "Não foi possível conectar a integração."
        }
      });
    }
  }

  async update(
    request: FastifyRequest<{
      Params: {
        siteId: string;
        integrationId: string;
      };
      Body:
        UpdateSiteIntegrationInput;
    }>,
    reply: FastifyReply
  ) {
    const context =
      contextOrReply(
        request,
        reply
      );

    if (!context) return;

    if (
      !canManageIntegrations(
        context.role
      )
    ) {
      return reply.status(403).send({
        success: false,
        error: {
          code:
            "INTEGRATION_MANAGE_FORBIDDEN",
          message:
            "Seu usuário não possui permissão para gerenciar integrações."
        }
      });
    }

    const parsed =
      updateSiteIntegrationSchema.safeParse(
        request.body
      );

    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message:
            "Os dados da integração são inválidos.",
          details:
            parsed.error.flatten()
        }
      });
    }

    try {
      const data =
        await siteIntegrationService.update(
          context.companyId,
          request.params.siteId,
          request.params.integrationId,
          parsed.data
        );

      return reply.send({
        success: true,
        message:
          "Integração atualizada com sucesso.",
        data
      });
    } catch (error: any) {
      request.log.error(error);

      if (
        error?.code ===
        "SITE_NOT_FOUND"
      ) {
        return reply.status(404).send({
          success: false,
          error: {
            code: "SITE_NOT_FOUND",
            message: error.message
          }
        });
      }

      if (
        error?.code ===
        "SITE_INTEGRATION_NOT_FOUND"
      ) {
        return reply.status(404).send({
          success: false,
          error: {
            code:
              "SITE_INTEGRATION_NOT_FOUND",
            message: error.message
          }
        });
      }

      return reply.status(500).send({
        success: false,
        error: {
          code:
            "SITE_INTEGRATION_UPDATE_FAILED",
          message:
            "Não foi possível atualizar a integração."
        }
      });
    }
  }

  async capiStatus(
    request: FastifyRequest<{
      Params: {
        siteId: string;
        integrationId: string;
      };
    }>,
    reply: FastifyReply
  ) {
    const context =
      contextOrReply(
        request,
        reply
      );

    if (!context) return;

    try {
      const data =
        await siteIntegrationService
          .getCapiStatus(
            context.companyId,
            request.params.siteId,
            request.params.integrationId
          );

      return reply.send({
        success: true,
        data
      });
    } catch (error: any) {
      request.log.error(
        {
          code: error?.code
        },
        "Falha ao consultar status CAPI."
      );

      if (
        error?.code ===
        "SITE_NOT_FOUND"
      ) {
        return reply.status(404).send({
          success: false,
          error: {
            code: "SITE_NOT_FOUND",
            message: error.message
          }
        });
      }

      if (
        error?.code ===
        "SITE_INTEGRATION_NOT_FOUND"
      ) {
        return reply.status(404).send({
          success: false,
          error: {
            code:
              "SITE_INTEGRATION_NOT_FOUND",
            message: error.message
          }
        });
      }

      if (
        error?.code ===
        "INTEGRATION_CAPI_UNSUPPORTED"
      ) {
        return reply.status(400).send({
          success: false,
          error: {
            code:
              "INTEGRATION_CAPI_UNSUPPORTED",
            message: error.message
          }
        });
      }

      return reply.status(500).send({
        success: false,
        error: {
          code:
            "CAPI_STATUS_LOAD_FAILED",
          message:
            "Não foi possível consultar a configuração CAPI."
        }
      });
    }
  }

  async setCapiSecret(
    request: FastifyRequest<{
      Params: {
        siteId: string;
        integrationId: string;
      };
      Body: SetMetaCapiSecretInput;
    }>,
    reply: FastifyReply
  ) {
    const context =
      contextOrReply(
        request,
        reply
      );

    if (!context) return;

    if (
      !canManageIntegrations(
        context.role
      )
    ) {
      return reply.status(403).send({
        success: false,
        error: {
          code:
            "INTEGRATION_MANAGE_FORBIDDEN",
          message:
            "Seu usuário não possui permissão para gerenciar integrações."
        }
      });
    }

    const parsed =
      setMetaCapiSecretSchema.safeParse(
        request.body
      );

    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message:
            "O token CAPI informado é inválido.",
          details:
            parsed.error.flatten()
        }
      });
    }

    try {
      const data =
        await siteIntegrationService
          .setCapiSecret(
            context.companyId,
            request.params.siteId,
            request.params.integrationId,
            parsed.data
          );

      return reply.send({
        success: true,
        message:
          "Token CAPI armazenado com segurança.",
        data
      });
    } catch (error: any) {
      /*
       * Não registrar request.body,
       * token ou argumentos da RPC.
       */
      request.log.error(
        {
          code: error?.code
        },
        "Falha ao armazenar token CAPI."
      );

      if (
        error?.code ===
        "SITE_NOT_FOUND"
      ) {
        return reply.status(404).send({
          success: false,
          error: {
            code: "SITE_NOT_FOUND",
            message: error.message
          }
        });
      }

      if (
        error?.code ===
        "SITE_INTEGRATION_NOT_FOUND"
      ) {
        return reply.status(404).send({
          success: false,
          error: {
            code:
              "SITE_INTEGRATION_NOT_FOUND",
            message: error.message
          }
        });
      }

      if (
        error?.code ===
        "INTEGRATION_CAPI_UNSUPPORTED"
      ) {
        return reply.status(400).send({
          success: false,
          error: {
            code:
              "INTEGRATION_CAPI_UNSUPPORTED",
            message: error.message
          }
        });
      }

      return reply.status(500).send({
        success: false,
        error: {
          code:
            "CAPI_SECRET_SAVE_FAILED",
          message:
            "Não foi possível armazenar o token CAPI."
        }
      });
    }
  }

  async deleteCapiSecret(
    request: FastifyRequest<{
      Params: {
        siteId: string;
        integrationId: string;
      };
    }>,
    reply: FastifyReply
  ) {
    const context =
      contextOrReply(
        request,
        reply
      );

    if (!context) return;

    if (
      !canManageIntegrations(
        context.role
      )
    ) {
      return reply.status(403).send({
        success: false,
        error: {
          code:
            "INTEGRATION_MANAGE_FORBIDDEN",
          message:
            "Seu usuário não possui permissão para gerenciar integrações."
        }
      });
    }

    try {
      const data =
        await siteIntegrationService
          .deleteCapiSecret(
            context.companyId,
            request.params.siteId,
            request.params.integrationId
          );

      return reply.send({
        success: true,
        message:
          "Token CAPI removido com sucesso.",
        data
      });
    } catch (error: any) {
      request.log.error(
        {
          code: error?.code
        },
        "Falha ao remover token CAPI."
      );

      if (
        error?.code ===
        "SITE_NOT_FOUND"
      ) {
        return reply.status(404).send({
          success: false,
          error: {
            code: "SITE_NOT_FOUND",
            message: error.message
          }
        });
      }

      if (
        error?.code ===
        "SITE_INTEGRATION_NOT_FOUND"
      ) {
        return reply.status(404).send({
          success: false,
          error: {
            code:
              "SITE_INTEGRATION_NOT_FOUND",
            message: error.message
          }
        });
      }

      if (
        error?.code ===
        "INTEGRATION_CAPI_UNSUPPORTED"
      ) {
        return reply.status(400).send({
          success: false,
          error: {
            code:
              "INTEGRATION_CAPI_UNSUPPORTED",
            message: error.message
          }
        });
      }

      return reply.status(500).send({
        success: false,
        error: {
          code:
            "CAPI_SECRET_DELETE_FAILED",
          message:
            "Não foi possível remover o token CAPI."
        }
      });
    }
  }

  async remove(
    request: FastifyRequest<{
      Params: {
        siteId: string;
        integrationId: string;
      };
    }>,
    reply: FastifyReply
  ) {
    const context =
      contextOrReply(
        request,
        reply
      );

    if (!context) return;

    if (
      !canManageIntegrations(
        context.role
      )
    ) {
      return reply.status(403).send({
        success: false,
        error: {
          code:
            "INTEGRATION_MANAGE_FORBIDDEN",
          message:
            "Seu usuário não possui permissão para gerenciar integrações."
        }
      });
    }

    try {
      const data =
        await siteIntegrationService.remove(
          context.companyId,
          request.params.siteId,
          request.params.integrationId
        );

      return reply.send({
        success: true,
        message:
          "Integração removida com sucesso.",
        data
      });
    } catch (error: any) {
      request.log.error(error);

      if (
        error?.code ===
        "SITE_NOT_FOUND"
      ) {
        return reply.status(404).send({
          success: false,
          error: {
            code: "SITE_NOT_FOUND",
            message: error.message
          }
        });
      }

      if (
        error?.code ===
        "SITE_INTEGRATION_NOT_FOUND"
      ) {
        return reply.status(404).send({
          success: false,
          error: {
            code:
              "SITE_INTEGRATION_NOT_FOUND",
            message: error.message
          }
        });
      }

      return reply.status(500).send({
        success: false,
        error: {
          code:
            "SITE_INTEGRATION_DELETE_FAILED",
          message:
            "Não foi possível remover a integração."
        }
      });
    }
  }
}

export const siteIntegrationController =
  new SiteIntegrationController();
