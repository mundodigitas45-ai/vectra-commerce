import type { FastifyInstance } from "fastify";
import { orderController } from "./order.controller";

export async function orderRoutes(
  app: FastifyInstance
) {
  app.get(
    "/api/v1/orders",
    orderController.list.bind(orderController)
  );

  app.post(
    "/api/v1/orders",
    orderController.create.bind(orderController)
  );
}