import type { FastifyInstance } from "fastify";
import { publicInterestEventSchema } from "./notification.schemas";
import { notificationService } from "./notification.service";

export async function notificationRoutes(
  app: FastifyInstance
) {
  app.get(
    "/api/v1/public/push/config",
    async (_request, reply) => {
      const publicKey =
        notificationService.getPublicKey();

      if (!publicKey) {
        return reply.status(503).send({
          success: false,
          error: {
            code: "PUSH_NOT_CONFIGURED",
            message: "Notificações ainda não configuradas."
          }
        });
      }

      return reply.send({
        success: true,
        data: {
          public_key: publicKey
        }
      });
    }
  );

  app.post(
    "/api/v1/public/interest-events",
    {
      config: {
        rateLimit: {
          max: 30,
          timeWindow: "1 minute"
        }
      }
    },
    async (request, reply) => {
      const parsed =
        publicInterestEventSchema.safeParse(
          request.body
        );

      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Evento de interesse inválido.",
            details: parsed.error.flatten()
          }
        });
      }

      try {
        const data =
          await notificationService
            .capturePublicInterest(parsed.data);

        return reply.status(202).send({
          success: true,
          data
        });
      } catch (error) {
        request.log.error(error);

        return reply.status(500).send({
          success: false,
          error: {
            code: "INTEREST_EVENT_FAILED",
            message: "Evento não registrado."
          }
        });
      }
    }
  );
}
