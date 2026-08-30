import type {
  FastifyReply,
  FastifyRequest
} from "fastify";

import {
  createOnboardingSessionSchema,
  updateOnboardingSessionSchema,
  type CreateOnboardingSessionInput,
  type UpdateOnboardingSessionInput
} from "./onboarding.schemas";

import {
  onboardingService,
  OnboardingServiceError
} from "./onboarding.service";

function contextOrReply(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const context = request.userAuthContext;

  if (!context) {
    reply.status(500).send({
      success: false,
      error: {
        code: "USER_CONTEXT_MISSING",
        message:
          "Não foi possível identificar o usuário."
      }
    });

    return null;
  }

  return context;
}

function sendError(
  request: FastifyRequest,
  reply: FastifyReply,
  error: unknown
) {
  if (error instanceof OnboardingServiceError) {
    return reply.status(error.statusCode).send({
      success: false,
      error: {
        code: error.code,
        message: error.message
      }
    });
  }

  request.log.error(
    error,
    "Falha no onboarding"
  );

  return reply.status(500).send({
    success: false,
    error: {
      code: "ONBOARDING_OPERATION_FAILED",
      message:
        "Não foi possível concluir esta etapa do cadastro."
    }
  });
}

export class OnboardingController {
  async getCurrent(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    const context =
      contextOrReply(request, reply);

    if (!context) return;

    try {
      const session =
        await onboardingService.getCurrent(
          context.userId
        );

      return reply.send({
        success: true,
        data: session
      });
    } catch (error) {
      return sendError(
        request,
        reply,
        error
      );
    }
  }

  async create(
    request: FastifyRequest<{
      Body: CreateOnboardingSessionInput;
    }>,
    reply: FastifyReply
  ) {
    const context =
      contextOrReply(request, reply);

    if (!context) return;

    const parsed =
      createOnboardingSessionSchema.safeParse(
        request.body ?? {}
      );

    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message:
            "Os dados iniciais são inválidos.",
          details: parsed.error.flatten()
        }
      });
    }

    try {
      const session =
        await onboardingService.create(
          context.userId,
          context.email,
          parsed.data
        );

      return reply.status(201).send({
        success: true,
        data: session
      });
    } catch (error) {
      return sendError(
        request,
        reply,
        error
      );
    }
  }

  async update(
    request: FastifyRequest<{
      Body: UpdateOnboardingSessionInput;
    }>,
    reply: FastifyReply
  ) {
    const context =
      contextOrReply(request, reply);

    if (!context) return;

    const parsed =
      updateOnboardingSessionSchema.safeParse(
        request.body ?? {}
      );

    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message:
            "Os dados do cadastro são inválidos.",
          details: parsed.error.flatten()
        }
      });
    }

    try {
      const session =
        await onboardingService.update(
          context.userId,
          parsed.data
        );

      return reply.send({
        success: true,
        data: session
      });
    } catch (error) {
      return sendError(
        request,
        reply,
        error
      );
    }
  }
}

export const onboardingController =
  new OnboardingController();
