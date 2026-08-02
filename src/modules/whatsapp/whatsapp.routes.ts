import type { FastifyInstance } from "fastify";

import { requireStockAdmin } from "../stock/stock.auth";
import { whatsappController } from "./whatsapp.controller";

interface ResumeParams {
  customerNumber: string;
}

export async function whatsappRoutes(
  app: FastifyInstance
) {
  app.post<{
    Params: ResumeParams;
  }>(
    "/api/v1/whatsapp/sessions/:customerNumber/resume",
    {
      preHandler: requireStockAdmin
    },
    whatsappController.resumeAutomation.bind(
      whatsappController
    )
  );
}
