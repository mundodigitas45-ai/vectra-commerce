import type { FastifyInstance } from "fastify";
import { customerController } from "./customer.controller";

export async function customerRoutes(
  app: FastifyInstance
) {
  app.get(
    "/api/v1/customers",
    customerController.list.bind(customerController)
  );

  app.post(
    "/api/v1/customers",
    customerController.create.bind(customerController)
  );
}