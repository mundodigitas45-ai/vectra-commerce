import type {
  FastifyReply,
  FastifyRequest
} from "fastify";
import {
  claimCreativeImageJobSchema,
  completeCreativeImageJobSchema,
  failCreativeImageJobSchema,
  type ClaimCreativeImageJobInput,
  type CompleteCreativeImageJobInput,
  type FailCreativeImageJobInput
} from "./creative-image-worker.schemas";
import { creativeImageWorkerService } from "./creative-image-worker.service";

interface JobParams {
  jobId: string;
}

function imageWorkerFailure(
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
      : "CREATIVE_IMAGE_WORKER_OPERATION_FAILED";

  const status =
    code === "CREATIVE_IMAGE_JOB_LEASE_INVALID"
      ? 409
      : [
          "CREATIVE_IMAGE_JOB_INVALID",
          "CREATIVE_IMAGE_JOB_MISMATCH",
          "CREATIVE_IMAGE_INVALID",
          "CREATIVE_CHANNEL_NOT_FOUND",
          "CREATIVE_APPROVED_COPY_REQUIRED"
        ].includes(code)
        ? 400
        : 500;

  return reply.status(status).send({
    success: false,
    error: {
      code,
      message:
        error instanceof Error
          ? error.message
          : "Não foi possível concluir a operação visual."
    }
  });
}

export class CreativeImageWorkerController {
  async claim(
    request: FastifyRequest<{
      Body: ClaimCreativeImageJobInput;
    }>,
    reply: FastifyReply
  ) {
    const parsed = claimCreativeImageJobSchema.safeParse(
      request.body
    );

    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "A solicitação do job visual é inválida.",
          details: parsed.error.flatten()
        }
      });
    }

    try {
      const data =
        await creativeImageWorkerService.claim(
          parsed.data
        );

      return reply.send({
        success: true,
        data,
        empty: data === null
      });
    } catch (error) {
      return imageWorkerFailure(
        request,
        reply,
        error
      );
    }
  }

  async complete(
    request: FastifyRequest<{
      Params: JobParams;
      Body: CompleteCreativeImageJobInput;
    }>,
    reply: FastifyReply
  ) {
    const parsed =
      completeCreativeImageJobSchema.safeParse(
        request.body
      );

    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "O resultado visual é inválido.",
          details: parsed.error.flatten()
        }
      });
    }

    try {
      const data =
        await creativeImageWorkerService.complete(
          request.params.jobId,
          parsed.data
        );

      return reply.send({
        success: true,
        message: "Imagem criada e enviada para revisão.",
        data
      });
    } catch (error) {
      return imageWorkerFailure(
        request,
        reply,
        error
      );
    }
  }

  async fail(
    request: FastifyRequest<{
      Params: JobParams;
      Body: FailCreativeImageJobInput;
    }>,
    reply: FastifyReply
  ) {
    const parsed =
      failCreativeImageJobSchema.safeParse(
        request.body
      );

    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Os dados da falha visual são inválidos.",
          details: parsed.error.flatten()
        }
      });
    }

    try {
      const data =
        await creativeImageWorkerService.fail(
          request.params.jobId,
          parsed.data
        );

      return reply.send({
        success: true,
        message: "Falha visual registrada.",
        data
      });
    } catch (error) {
      return imageWorkerFailure(
        request,
        reply,
        error
      );
    }
  }
}

export const creativeImageWorkerController =
  new CreativeImageWorkerController();
