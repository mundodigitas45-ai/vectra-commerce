import type {
  FastifyReply,
  FastifyRequest
} from "fastify";

import {
  analyticsSummaryQuerySchema,
  publicAnalyticsEventSchema
} from "./site-analytics.schemas";
import { siteAnalyticsService } from "./site-analytics.service";

export class SiteAnalyticsController {
  async registerEvent(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    const parsed = publicAnalyticsEventSchema.safeParse(
      request.body
    );

    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Os dados do evento são inválidos.",
          details: parsed.error.flatten()
        }
      });
    }

    try {
      const data = await siteAnalyticsService.registerEvent(
        parsed.data
      );

      return reply.status(202).send({
        success: true,
        data
      });
    } catch (error: any) {
      request.log.error(error);

      const notFound = error?.code === "SITE_NOT_FOUND";

      return reply.status(notFound ? 404 : 500).send({
        success: false,
        error: {
          code: notFound
            ? "SITE_NOT_FOUND"
            : "ANALYTICS_EVENT_FAILED",
          message: notFound
            ? error.message
            : "Não foi possível registrar o evento."
        }
      });
    }
  }

  async summary(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    const context = request.authContext;

    if (!context) {
      return reply.status(500).send({
        success: false,
        error: {
          code: "COMPANY_CONTEXT_MISSING",
          message: "Não foi possível identificar a empresa ativa."
        }
      });
    }

    const parsed = analyticsSummaryQuerySchema.safeParse(
      request.query
    );

    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Os filtros do relatório são inválidos.",
          details: parsed.error.flatten()
        }
      });
    }

    try {
      const data = await siteAnalyticsService.summary(
        context.companyId,
        parsed.data.site_id,
        parsed.data.days
      );

      return reply.send({
        success: true,
        data
      });
    } catch (error: any) {
      request.log.error(error);

      const notFound = error?.code === "SITE_NOT_FOUND";

      return reply.status(notFound ? 404 : 500).send({
        success: false,
        error: {
          code: notFound
            ? "SITE_NOT_FOUND"
            : "ANALYTICS_SUMMARY_FAILED",
          message: notFound
            ? error.message
            : "Não foi possível carregar as métricas."
        }
      });
    }
  }
}

export const siteAnalyticsController =
  new SiteAnalyticsController();
