import type { FastifyInstance } from "fastify";

import { requireCompanyAccess } from "./company-context.auth";

export async function companyContextRoutes(
  app: FastifyInstance
) {
  app.get(
    "/api/v1/company-context",
    {
      preHandler: requireCompanyAccess
    },
    async (request, reply) => {
      const context = request.authContext;

      if (!context) {
        return reply.status(500).send({
          success: false,
          error: {
            code: "COMPANY_CONTEXT_MISSING",
            message: "Não foi possível identificar o contexto da empresa."
          }
        });
      }

      return reply.send({
        success: true,
        data: {
          user_id: context.userId,
          email: context.email,
          company_id: context.companyId,
          role: context.role
        }
      });
    }
  );
}
