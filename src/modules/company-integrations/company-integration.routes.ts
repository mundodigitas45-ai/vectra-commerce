import type {
  FastifyInstance
} from "fastify";

import {
  requireCompanyAccess
} from "../auth/company-context.auth";

import {
  companyIntegrationController
} from "./company-integration.controller";

import type {
  ConnectOpenAiInput
} from "./company-integration.schemas";

export async function companyIntegrationRoutes(
  app: FastifyInstance
) {
  app.get(
    "/api/v1/company-integrations",
    {
      preHandler: requireCompanyAccess
    },
    companyIntegrationController.list.bind(
      companyIntegrationController
    )
  );

  app.put<{
    Body: ConnectOpenAiInput;
  }>(
    "/api/v1/company-integrations/openai",
    {
      preHandler: requireCompanyAccess
    },
    companyIntegrationController
      .connectOpenAi
      .bind(companyIntegrationController)
  );

  app.post(
    "/api/v1/company-integrations/openai/test",
    {
      preHandler: requireCompanyAccess
    },
    companyIntegrationController
      .testOpenAi
      .bind(companyIntegrationController)
  );

  app.delete(
    "/api/v1/company-integrations/openai",
    {
      preHandler: requireCompanyAccess
    },
    companyIntegrationController
      .disconnectOpenAi
      .bind(companyIntegrationController)
  );
}
