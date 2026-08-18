import { timingSafeEqual } from "node:crypto";
import type {
  FastifyReply,
  FastifyRequest
} from "fastify";

function secureEqual(
  received: string,
  expected: string
): boolean {
  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);

  return (
    receivedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(receivedBuffer, expectedBuffer)
  );
}

export async function requireCreativeWorker(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const expected =
    process.env.CREATIVE_WORKER_SECRET?.trim();

  if (!expected) {
    request.log.error({
      message: "CREATIVE_WORKER_SECRET não configurado"
    });

    return reply.status(503).send({
      success: false,
      error: {
        code: "CREATIVE_WORKER_NOT_CONFIGURED",
        message: "O executor de criativos ainda não está configurado."
      }
    });
  }

  const rawHeader =
    request.headers["x-creative-worker-secret"];

  const received = Array.isArray(rawHeader)
    ? rawHeader[0]
    : rawHeader;

  if (
    typeof received !== "string" ||
    !secureEqual(received, expected)
  ) {
    return reply.status(401).send({
      success: false,
      error: {
        code: "CREATIVE_WORKER_UNAUTHORIZED",
        message: "Credencial do executor inválida."
      }
    });
  }
}
