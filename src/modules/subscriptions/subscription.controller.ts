import type {
  FastifyReply,
  FastifyRequest
} from "fastify";

import { subscriptionService } from "./subscription.service";

export class SubscriptionController {
  async listPublicPlans(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      const plans =
        await subscriptionService.listPublicPlans();

      return reply.send({
        success: true,
        data: plans
      });
    } catch (error) {
      request.log.error(
        error,
        "Falha ao carregar planos públicos"
      );

      return reply.status(500).send({
        success: false,
        error: {
          code: "PUBLIC_PLANS_LOAD_FAILED",
          message:
            "Não foi possível carregar os planos disponíveis."
        }
      });
    }
  }
}

export const subscriptionController =
  new SubscriptionController();
