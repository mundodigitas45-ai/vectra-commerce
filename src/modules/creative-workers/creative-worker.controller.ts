import type {
  FastifyReply,
  FastifyRequest
} from "fastify";
import {
  claimCreativeJobSchema,
  completeCreativeJobSchema,
  failCreativeJobSchema,
  type ClaimCreativeJobInput,
  type CompleteCreativeJobInput,
  type FailCreativeJobInput
} from "./creative-worker.schemas";
import { creativeWorkerService } from "./creative-worker.service";

interface JobParams {
  jobId: string;
}

function workerFailure(
  request: FastifyRequest,
  reply: FastifyReply,
  error: unknown
) {
  request.log.error(error);

  const code =
    typeof error === "object" &&
    error &&
    "code" in error
      ? String(error.code)
      : "CREATIVE_WORKER_OPERATION_FAILED";

  const status =
    code === "CREATIVE_JOB_LEASE_INVALID"
      ? 409
      : code === "CREATIVE_CHANNEL_NOT_FOUND"
        ? 400
        : 500;

  return reply.status(status).send({
    success: false,
    error: {
      code,
      message:
        error instanceof Error
          ? error.message
          : "Não foi possível concluir a operação do executor."
    }
  });
}

export class CreativeWorkerController {
  async claim(
    request: FastifyRequest<{
      Body: ClaimCreativeJobInput;
    }>,
    reply: FastifyReply
  ) {
    const parsed = claimCreativeJobSchema.safeParse(
      request.body
    );

    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "A solicitação de job é inválida.",
          details: parsed.error.flatten()
        }
      });
    }

    try {
      const data =
        await creativeWorkerService.claim(parsed.data);

      return reply.send({
        success: true,
        data,
        empty: data === null
      });
    } catch (error) {
      return workerFailure(
        request,
        reply,
        error
      );
    }
  }

  async complete(
    request: FastifyRequest<{
      Params: JobParams;
      Body: CompleteCreativeJobInput;
    }>,
    reply: FastifyReply
  ) {
    const parsed =
      completeCreativeJobSchema.safeParse(
        request.body
      );

    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "O resultado do job é inválido.",
          details: parsed.error.flatten()
        }
      });
    }

    try {
      const data =
        await creativeWorkerService.complete(
          request.params.jobId,
          parsed.data
        );

      return reply.send({
        success: true,
        message: "Job concluído e enviado para revisão.",
        data
      });
    } catch (error) {
      return workerFailure(
        request,
        reply,
        error
      );
    }
  }

  async fail(
    request: FastifyRequest<{
      Params: JobParams;
      Body: FailCreativeJobInput;
    }>,
    reply: FastifyReply
  ) {
    const parsed = failCreativeJobSchema.safeParse(
      request.body
    );

    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Os dados da falha são inválidos.",
          details: parsed.error.flatten()
        }
      });
    }

    try {
      const data =
        await creativeWorkerService.fail(
          request.params.jobId,
          parsed.data
        );

      return reply.send({
        success: true,
        message: "Falha registrada no job.",
        data
      });
    } catch (error) {
      return workerFailure(
        request,
        reply,
        error
      );
    }
  }
}

export const creativeWorkerController =
  new CreativeWorkerController();
