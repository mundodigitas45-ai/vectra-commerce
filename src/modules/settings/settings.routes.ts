import type { FastifyInstance } from "fastify";
import { settingsController } from "./settings.controller";

export async function settingsRoutes(
  app: FastifyInstance
) {
  app.get(
    "/api/v1/settings",
    settingsController.get.bind(settingsController)
  );

  app.put(
    "/api/v1/settings",
    settingsController.update.bind(settingsController)
  );
}
