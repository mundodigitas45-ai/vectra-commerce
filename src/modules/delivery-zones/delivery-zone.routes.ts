import type {
  FastifyInstance
} from "fastify";

import { requireStockAdmin } from "../stock/stock.auth";

import { deliveryZoneController } from "./delivery-zone.controller";

import type {
  CreateDeliveryZoneInput,
  UpdateDeliveryZoneInput,
  UpdateDeliveryZoneStatusInput
} from "./delivery-zone.schemas";

interface DeliveryZoneParams {
  zoneId: string;
}

export async function deliveryZoneRoutes(
  app: FastifyInstance
) {
  app.get(
    "/api/v1/delivery-zones",
    {
      preHandler: requireStockAdmin
    },
    deliveryZoneController.list.bind(
      deliveryZoneController
    )
  );

  app.get<{
    Params: DeliveryZoneParams;
  }>(
    "/api/v1/delivery-zones/:zoneId",
    {
      preHandler: requireStockAdmin
    },
    deliveryZoneController.getById.bind(
      deliveryZoneController
    )
  );

  app.post<{
    Body: CreateDeliveryZoneInput;
  }>(
    "/api/v1/delivery-zones",
    {
      preHandler: requireStockAdmin
    },
    deliveryZoneController.create.bind(
      deliveryZoneController
    )
  );

  app.patch<{
    Params: DeliveryZoneParams;
    Body: UpdateDeliveryZoneInput;
  }>(
    "/api/v1/delivery-zones/:zoneId",
    {
      preHandler: requireStockAdmin
    },
    deliveryZoneController.update.bind(
      deliveryZoneController
    )
  );

  app.patch<{
    Params: DeliveryZoneParams;
    Body: UpdateDeliveryZoneStatusInput;
  }>(
    "/api/v1/delivery-zones/:zoneId/status",
    {
      preHandler: requireStockAdmin
    },
    deliveryZoneController.updateStatus.bind(
      deliveryZoneController
    )
  );
}
