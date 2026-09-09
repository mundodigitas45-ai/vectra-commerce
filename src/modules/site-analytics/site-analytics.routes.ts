import type {
  FastifyInstance
} from "fastify";

import {
  requireCompanyAccess
} from "../auth/company-context.auth";
import {
  siteAnalyticsController
} from "./site-analytics.controller";

export async function siteAnalyticsRoutes(
  app: FastifyInstance
) {
  app.post(
    "/api/public/site-analytics/events",
    {
      config: {
        rateLimit: {
          max: 60,
          timeWindow: "1 minute"
        }
      }
    },
    siteAnalyticsController.registerEvent.bind(
      siteAnalyticsController
    )
  );

  app.get(
    "/api/v1/site-analytics/summary",
    {
      preHandler: requireCompanyAccess
    },
    siteAnalyticsController.summary.bind(
      siteAnalyticsController
    )
  );
}
