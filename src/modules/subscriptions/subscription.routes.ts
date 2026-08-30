import type { FastifyInstance } from "fastify";

import { subscriptionController } from "./subscription.controller";

export async function subscriptionRoutes(
  app: FastifyInstance
) {
  app.get(
    "/api/v1/public/saas/plans",
    subscriptionController.listPublicPlans.bind(
      subscriptionController
    )
  );
}
