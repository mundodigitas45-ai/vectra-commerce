import type { FastifyInstance } from "fastify";

import { requireStockAdmin } from "./stock.auth";
import { stockController } from "./stock.controller";
import type {
  StockAdjustmentInput,
  StockEntryInput,
  StockRemovalInput
} from "./stock.schemas";

export async function stockRoutes(
  app: FastifyInstance
) {
  app.post<{ Body: StockEntryInput }>(
    "/api/v1/stock/entries",
    {
      preHandler: requireStockAdmin
    },
    stockController.entry.bind(stockController)
  );

  app.post<{ Body: StockRemovalInput }>(
    "/api/v1/stock/removals",
    {
      preHandler: requireStockAdmin
    },
    stockController.removal.bind(stockController)
  );

  app.post<{ Body: StockAdjustmentInput }>(
    "/api/v1/stock/adjustments",
    {
      preHandler: requireStockAdmin
    },
    stockController.adjustment.bind(stockController)
  );
}
