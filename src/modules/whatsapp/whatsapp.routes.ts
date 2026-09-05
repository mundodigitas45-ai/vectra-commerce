import type { FastifyInstance } from "fastify";

import { requireStockAdmin } from "../stock/stock.auth";

import { whatsappController } from "./whatsapp.controller";

interface SessionParams {
  customerNumber: string;
}

interface PauseBody {
  reason?: string;
  actor_type?: string;
  actor_user_id?: string | null;
  source?: string;
}

export async function whatsappRoutes(app: FastifyInstance) {
  app.post<{
    Params: SessionParams;
    Body: PauseBody;
  }>(
    "/api/v1/whatsapp/sessions/:customerNumber/pause",
    {
      preHandler: requireStockAdmin,
    },
    whatsappController.pauseAutomation.bind(whatsappController),
  );

  app.post<{
    Params: SessionParams;
  }>(
    "/api/v1/whatsapp/sessions/:customerNumber/resume",
    {
      preHandler: requireStockAdmin,
    },
    whatsappController.resumeAutomation.bind(whatsappController),
  );
}
