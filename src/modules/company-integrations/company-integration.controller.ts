import type {
  FastifyReply,
  FastifyRequest
} from "fastify";

import {
  connectOpenAiSchema,
  type ConnectOpenAiInput
} from "./company-integration.schemas";

import {
  companyIntegrationService
} from "./company-integration.service";

type CodedError = Error & {
  code?: string;
  httpStatus?: number;
};

function canManage(role: string) {
  return role === "owner" ||
    role === "admin";
}

function contextOrReply(
  request: FastifyRequest,
  reply: FastifyReply
) {
  if (request.authContext) {
    return request.authContext;
  }

  reply.status(401).send({
    success: false,
    error: {
      code: "AUTH_REQUIRED",
      message:
        "É necessário entrar novamente no painel."
    }
  });

  return null;
}

function errorResponse(
  error: unknown,
  reply: FastifyReply
) {
  const typed =
    error as CodedError;

  const code =
    typed?.code ??
    "COMPANY_INTEGRATION_FAILED";

  const knownStatuses:
    Record<string, number> = {
      ACTIVE_SUBSCRIPTION_REQUIRED: 402,
      INTEGRATION_FEATURE_NOT_INCLUDED: 403,
      COMPANY_INTEGRATION_NOT_FOUND: 404,
      OPENAI_NOT_CONFIGURED: 404,
      OPENAI_KEY_INVALID: 400,
      OPENAI_KEY_FORBIDDEN: 400,
      OPENAI_RATE_LIMITED: 429,
      OPENAI_VALIDATION_TIMEOUT: 504,
      OPENAI_VALIDATION_FAILED: 502
    };

  const status =
    knownStatuses[code] ??
    typed?.httpStatus ??
    500;

  const safeMessage =
    status >= 500
      ? "Não foi possível concluir a integração."
      : typed?.message ??
        "Não foi possível concluir a integração.";

  return reply.status(status).send({
    success: false,
    error: {
      code,
      message: safeMessage
    }
  });
}

export class CompanyIntegrationController {
  async list(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    const context =
      contextOrReply(request, reply);

    if (!context) return;

    try {
      const data =
        await companyIntegrationService
          .list(context.companyId);

      return reply.send({
        success: true,
        data
      });
    } catch (error: unknown) {
      request.log.error(
        {},
        "Falha ao listar integrações da empresa."
      );

      return errorResponse(
        error,
        reply
      );
    }
  }

  async connectOpenAi(
    request: FastifyRequest<{
      Body: ConnectOpenAiInput;
    }>,
    reply: FastifyReply
  ) {
    const context =
      contextOrReply(request, reply);

    if (!context) return;

    if (!canManage(context.role)) {
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
      connectOpenAiSchema.safeParse(
        request.body
      );

    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message:
            "A configuração OpenAI é inválida.",
          details:
            parsed.error.flatten()
        }
      });
    }

    try {
      const data =
        await companyIntegrationService
          .connectOpenAi(
            context.companyId,
            context.userId,
            parsed.data
          );

      return reply.send({
        success: true,
        message:
          "OpenAI conectada com segurança.",
        data
      });
    } catch (error: unknown) {
      /*
       * Nunca registrar request.body,
       * api_key ou argumentos do Vault.
       */
      request.log.error(
        {
          code:
            (error as CodedError)?.code
        },
        "Falha ao conectar OpenAI."
      );

      return errorResponse(
        error,
        reply
      );
    }
  }

  async testOpenAi(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    const context =
      contextOrReply(request, reply);

    if (!context) return;

    if (!canManage(context.role)) {
      return reply.status(403).send({
        success: false,
        error: {
          code:
            "INTEGRATION_MANAGE_FORBIDDEN",
          message:
            "Seu usuário não possui permissão para testar integrações."
        }
      });
    }

    try {
      const data =
        await companyIntegrationService
          .testOpenAi(context.companyId);

      return reply.send({
        success: true,
        message:
          "Conexão OpenAI validada.",
        data
      });
    } catch (error: unknown) {
      request.log.error(
        {
          code:
            (error as CodedError)?.code
        },
        "Falha ao testar OpenAI."
      );

      return errorResponse(
        error,
        reply
      );
    }
  }

  async disconnectOpenAi(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    const context =
      contextOrReply(request, reply);

    if (!context) return;

    if (!canManage(context.role)) {
      return reply.status(403).send({
        success: false,
        error: {
          code:
            "INTEGRATION_MANAGE_FORBIDDEN",
          message:
            "Seu usuário não possui permissão para remover integrações."
        }
      });
    }

    try {
      const data =
        await companyIntegrationService
          .disconnectOpenAi(
            context.companyId
          );

      return reply.send({
        success: true,
        message:
          "OpenAI desconectada.",
        data
      });
    } catch (error: unknown) {
      request.log.error(
        {
          code:
            (error as CodedError)?.code
        },
        "Falha ao desconectar OpenAI."
      );

      return errorResponse(
        error,
        reply
      );
    }
  }
}

export const companyIntegrationController =
  new CompanyIntegrationController();
