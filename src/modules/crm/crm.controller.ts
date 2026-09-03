import type {
  FastifyReply,
  FastifyRequest
} from "fastify";

import { crmService } from "./crm.service";

import {
  createCrmActivitySchema,
  createCrmContactSchema,
  createCrmOpportunitySchema,
  crmBoardQuerySchema,
  crmContactParamsSchema,
  crmContactsQuerySchema,
  crmOpportunityParamsSchema,
  moveCrmOpportunitySchema,
  updateCrmOpportunitySchema
} from "./crm.schemas";

type CodedError = Error & {
  code?: string;
  httpStatus?: number;
};

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

function canOperate(role: string) {
  return (
    role === "owner" ||
    role === "admin"
  );
}

function operationForbidden(
  reply: FastifyReply
) {
  return reply.status(403).send({
    success: false,
    error: {
      code: "CRM_OPERATION_FORBIDDEN",
      message:
        "Seu usuário não possui permissão para alterar o CRM."
    }
  });
}

function validationError(
  reply: FastifyReply,
  message: string,
  details: unknown
) {
  return reply.status(400).send({
    success: false,
    error: {
      code: "VALIDATION_ERROR",
      message,
      details
    }
  });
}

function errorResponse(
  error: unknown,
  reply: FastifyReply
) {
  const typed =
    error as CodedError;

  const code =
    typed?.code ??
    "CRM_OPERATION_FAILED";

  const statuses:
    Record<string, number> = {
      CRM_PIPELINE_NOT_FOUND: 404,
      CRM_STAGE_NOT_FOUND: 404,
      CRM_CONTACT_NOT_FOUND: 404,
      CRM_OPPORTUNITY_NOT_FOUND: 404,
      CRM_INVALID_CHANNEL_IDENTIFIER: 400,
      CRM_LOST_REASON_REQUIRED: 400,
      CRM_ACTIVITY_ALREADY_EXISTS: 409,
      CRM_CUSTOMER_COMPANY_MISMATCH: 409,
      CRM_STORE_COMPANY_MISMATCH: 409,
      CRM_ORDER_COMPANY_MISMATCH: 409,
      CRM_ASSIGNEE_COMPANY_MISMATCH: 409,
      "23503": 409,
      "23505": 409,
      "23514": 409
    };

  const status =
    statuses[code] ??
    typed?.httpStatus ??
    500;

  const message =
    status >= 500
      ? "Não foi possível concluir a operação do CRM."
      : (
          typed?.message ??
          "Não foi possível concluir a operação do CRM."
        );

  return reply.status(status).send({
    success: false,
    error: {
      code,
      message
    }
  });
}

export class CrmController {
  async board(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    const context =
      contextOrReply(request, reply);

    if (!context) return;

    const parsed =
      crmBoardQuerySchema.safeParse(
        request.query
      );

    if (!parsed.success) {
      return validationError(
        reply,
        "Os filtros do quadro são inválidos.",
        parsed.error.flatten()
      );
    }

    try {
      const data =
        await crmService.getBoard(
          context.companyId,
          parsed.data
        );

      return reply.send({
        success: true,
        data
      });
    } catch (error: unknown) {
      request.log.error(
        {
          code:
            (error as CodedError)?.code
        },
        "Falha ao carregar quadro CRM."
      );

      return errorResponse(
        error,
        reply
      );
    }
  }

  async listContacts(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    const context =
      contextOrReply(request, reply);

    if (!context) return;

    const parsed =
      crmContactsQuerySchema.safeParse(
        request.query
      );

    if (!parsed.success) {
      return validationError(
        reply,
        "Os filtros de contatos são inválidos.",
        parsed.error.flatten()
      );
    }

    try {
      const data =
        await crmService.listContacts(
          context.companyId,
          parsed.data
        );

      return reply.send({
        success: true,
        data
      });
    } catch (error: unknown) {
      request.log.error(
        {
          code:
            (error as CodedError)?.code
        },
        "Falha ao listar contatos CRM."
      );

      return errorResponse(
        error,
        reply
      );
    }
  }

  async getContact(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    const context =
      contextOrReply(request, reply);

    if (!context) return;

    const parsed =
      crmContactParamsSchema.safeParse(
        request.params
      );

    if (!parsed.success) {
      return validationError(
        reply,
        "O contato informado é inválido.",
        parsed.error.flatten()
      );
    }

    try {
      const data =
        await crmService
          .getContactDetail(
            context.companyId,
            parsed.data.contactId
          );

      return reply.send({
        success: true,
        data
      });
    } catch (error: unknown) {
      return errorResponse(
        error,
        reply
      );
    }
  }

  async upsertContact(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    const context =
      contextOrReply(request, reply);

    if (!context) return;

    if (!canOperate(context.role)) {
      return operationForbidden(reply);
    }

    const parsed =
      createCrmContactSchema.safeParse(
        request.body
      );

    if (!parsed.success) {
      return validationError(
        reply,
        "Os dados do contato são inválidos.",
        parsed.error.flatten()
      );
    }

    try {
      const data =
        await crmService.upsertContact(
          context.companyId,
          context.userId,
          parsed.data
        );

      return reply.send({
        success: true,
        message:
          "Contato salvo no CRM.",
        data
      });
    } catch (error: unknown) {
      return errorResponse(
        error,
        reply
      );
    }
  }

  async createOpportunity(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    const context =
      contextOrReply(request, reply);

    if (!context) return;

    if (!canOperate(context.role)) {
      return operationForbidden(reply);
    }

    const parsed =
      createCrmOpportunitySchema
        .safeParse(request.body);

    if (!parsed.success) {
      return validationError(
        reply,
        "Os dados da oportunidade são inválidos.",
        parsed.error.flatten()
      );
    }

    try {
      const data =
        await crmService
          .createOpportunity(
            context.companyId,
            context.userId,
            parsed.data
          );

      return reply.status(201).send({
        success: true,
        message:
          "Oportunidade criada.",
        data
      });
    } catch (error: unknown) {
      return errorResponse(
        error,
        reply
      );
    }
  }

  async updateOpportunity(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    const context =
      contextOrReply(request, reply);

    if (!context) return;

    if (!canOperate(context.role)) {
      return operationForbidden(reply);
    }

    const params =
      crmOpportunityParamsSchema
        .safeParse(request.params);

    const body =
      updateCrmOpportunitySchema
        .safeParse(request.body);

    if (!params.success) {
      return validationError(
        reply,
        "A oportunidade informada é inválida.",
        params.error.flatten()
      );
    }

    if (!body.success) {
      return validationError(
        reply,
        "A atualização da oportunidade é inválida.",
        body.error.flatten()
      );
    }

    try {
      const data =
        await crmService
          .updateOpportunity(
            context.companyId,
            params.data.opportunityId,
            body.data
          );

      return reply.send({
        success: true,
        message:
          "Oportunidade atualizada.",
        data
      });
    } catch (error: unknown) {
      return errorResponse(
        error,
        reply
      );
    }
  }

  async moveOpportunity(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    const context =
      contextOrReply(request, reply);

    if (!context) return;

    if (!canOperate(context.role)) {
      return operationForbidden(reply);
    }

    const params =
      crmOpportunityParamsSchema
        .safeParse(request.params);

    const body =
      moveCrmOpportunitySchema
        .safeParse(request.body);

    if (!params.success) {
      return validationError(
        reply,
        "A oportunidade informada é inválida.",
        params.error.flatten()
      );
    }

    if (!body.success) {
      return validationError(
        reply,
        "A nova etapa é inválida.",
        body.error.flatten()
      );
    }

    try {
      const data =
        await crmService
          .moveOpportunity(
            context.companyId,
            params.data.opportunityId,
            body.data
          );

      return reply.send({
        success: true,
        message:
          "Oportunidade movimentada.",
        data
      });
    } catch (error: unknown) {
      return errorResponse(
        error,
        reply
      );
    }
  }

  async createActivity(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    const context =
      contextOrReply(request, reply);

    if (!context) return;

    if (!canOperate(context.role)) {
      return operationForbidden(reply);
    }

    const params =
      crmOpportunityParamsSchema
        .safeParse(request.params);

    const body =
      createCrmActivitySchema
        .safeParse(request.body);

    if (!params.success) {
      return validationError(
        reply,
        "A oportunidade informada é inválida.",
        params.error.flatten()
      );
    }

    if (!body.success) {
      return validationError(
        reply,
        "Os dados da atividade são inválidos.",
        body.error.flatten()
      );
    }

    try {
      const data =
        await crmService
          .createActivity(
            context.companyId,
            context.userId,
            params.data.opportunityId,
            body.data
          );

      return reply.status(201).send({
        success: true,
        message:
          "Atividade registrada.",
        data
      });
    } catch (error: unknown) {
      return errorResponse(
        error,
        reply
      );
    }
  }
}

export const crmController =
  new CrmController();
