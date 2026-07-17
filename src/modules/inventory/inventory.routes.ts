import type { FastifyInstance } from "fastify";
import { inventoryController } from "./inventory.controller";

export async function inventoryRoutes(
  app: FastifyInstance
) {
  app.get(
    "/api/v1/inventory/movements",
    inventoryController.listMovements.bind(
      inventoryController
    )
  );

  app.post(
    "/api/v1/inventory/movements",
    inventoryController.createMovement.bind(
      inventoryController
    )
  );
}