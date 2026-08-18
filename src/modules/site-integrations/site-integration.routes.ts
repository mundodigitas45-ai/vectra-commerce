import type {
  FastifyInstance
} from "fastify";

import {
  requireCompanyAccess
} from "../auth/company-context.auth";

import {
  siteIntegrationController
} from "./site-integration.controller";

import type {
  CreateSiteIntegrationInput,
  UpdateSiteIntegrationInput,
  SetMetaCapiSecretInput
} from "./site-integration.schemas";

interface SiteParams {
  siteId: string;
}

interface IntegrationParams
  extends SiteParams {
  integrationId: string;
}

export async function siteIntegrationRoutes(
  app: FastifyInstance
) {
  app.get<{
    Params: SiteParams;
  }>(
    "/api/v1/sites/:siteId/integrations",
    {
      preHandler:
        requireCompanyAccess
    },
    siteIntegrationController.list.bind(
      siteIntegrationController
    )
  );

  app.post<{
    Params: SiteParams;
    Body: CreateSiteIntegrationInput;
  }>(
    "/api/v1/sites/:siteId/integrations",
    {
      preHandler:
        requireCompanyAccess
    },
    siteIntegrationController.create.bind(
      siteIntegrationController
    )
  );

  app.patch<{
    Params: IntegrationParams;
    Body: UpdateSiteIntegrationInput;
  }>(
    "/api/v1/sites/:siteId/integrations/:integrationId",
    {
      preHandler:
        requireCompanyAccess
    },
    siteIntegrationController.update.bind(
      siteIntegrationController
    )
  );

  app.get<{
    Params: IntegrationParams;
  }>(
    "/api/v1/sites/:siteId/integrations/:integrationId/capi-status",
    {
      preHandler:
        requireCompanyAccess
    },
    siteIntegrationController.capiStatus.bind(
      siteIntegrationController
    )
  );

  app.put<{
    Params: IntegrationParams;
    Body: SetMetaCapiSecretInput;
  }>(
    "/api/v1/sites/:siteId/integrations/:integrationId/capi-secret",
    {
      preHandler:
        requireCompanyAccess
    },
    siteIntegrationController.setCapiSecret.bind(
      siteIntegrationController
    )
  );

  app.delete<{
    Params: IntegrationParams;
  }>(
    "/api/v1/sites/:siteId/integrations/:integrationId/capi-secret",
    {
      preHandler:
        requireCompanyAccess
    },
    siteIntegrationController.deleteCapiSecret.bind(
      siteIntegrationController
    )
  );

  app.delete<{
    Params: IntegrationParams;
  }>(
    "/api/v1/sites/:siteId/integrations/:integrationId",
    {
      preHandler:
        requireCompanyAccess
    },
    siteIntegrationController.remove.bind(
      siteIntegrationController
    )
  );
}
