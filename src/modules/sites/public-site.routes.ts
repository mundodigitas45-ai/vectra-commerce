import type {
  FastifyInstance
} from "fastify";

import {
  getPublicSiteConfigByDomain
} from "./site.repository";

export async function publicSiteRoutes(
  app: FastifyInstance
) {
  app.get<{
    Querystring: {
      domain?: string;
    };
  }>(
    "/api/public/sites/config",
    async (request, reply) => {
      const domain =
        request.query.domain?.trim();

      if (!domain) {
        return reply.status(400).send({
          success: false,
          error: {
            code: "DOMAIN_REQUIRED",
            message:
              "Informe o domínio do site."
          }
        });
      }

      try {
        const data =
          await getPublicSiteConfigByDomain(
            domain
          );

        if (!data) {
          return reply.status(404).send({
            success: false,
            error: {
              code: "SITE_NOT_FOUND",
              message:
                "Site não encontrado ou desativado."
            }
          });
        }

        return reply.send({
          success: true,
          data
        });
      } catch (error) {
        request.log.error(error);

        return reply.status(500).send({
          success: false,
          error: {
            code:
              "PUBLIC_SITE_CONFIG_FAILED",
            message:
              "Não foi possível carregar a configuração pública do site."
          }
        });
      }
    }
  );
}
