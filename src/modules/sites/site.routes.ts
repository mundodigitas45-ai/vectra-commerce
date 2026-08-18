import type {
  FastifyInstance
} from "fastify";

import {
  requireCompanyAccess
} from "../auth/company-context.auth";

import {
  siteController
} from "./site.controller";

import type {
  CreateSiteInput
} from "./site.schemas";

export async function siteRoutes(
  app: FastifyInstance
) {
  app.get(
    "/api/v1/sites",
    {
      preHandler:
        requireCompanyAccess
    },
    siteController.list.bind(
      siteController
    )
  );

  app.post<{
    Body: CreateSiteInput;
  }>(
    "/api/v1/sites",
    {
      preHandler:
        requireCompanyAccess
    },
    siteController.create.bind(
      siteController
    )
  );
}
