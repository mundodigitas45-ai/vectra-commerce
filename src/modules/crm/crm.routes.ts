import type {
  FastifyInstance
} from "fastify";

import {
  requireCompanyAccess
} from "../auth/company-context.auth";

import {
  crmController
} from "./crm.controller";

export async function crmRoutes(
  app: FastifyInstance
) {
  app.get(
    "/api/v1/crm/board",
    {
      preHandler:
        requireCompanyAccess
    },
    crmController.board.bind(
      crmController
    )
  );

  app.get(
    "/api/v1/crm/contacts",
    {
      preHandler:
        requireCompanyAccess
    },
    crmController.listContacts.bind(
      crmController
    )
  );

  app.get(
    "/api/v1/crm/contacts/:contactId",
    {
      preHandler:
        requireCompanyAccess
    },
    crmController.getContact.bind(
      crmController
    )
  );

  app.post(
    "/api/v1/crm/contacts",
    {
      preHandler:
        requireCompanyAccess
    },
    crmController.upsertContact.bind(
      crmController
    )
  );

  app.post(
    "/api/v1/crm/opportunities",
    {
      preHandler:
        requireCompanyAccess
    },
    crmController
      .createOpportunity
      .bind(crmController)
  );

  app.patch(
    "/api/v1/crm/opportunities/:opportunityId",
    {
      preHandler:
        requireCompanyAccess
    },
    crmController
      .updateOpportunity
      .bind(crmController)
  );

  app.post(
    "/api/v1/crm/opportunities/:opportunityId/move",
    {
      preHandler:
        requireCompanyAccess
    },
    crmController
      .moveOpportunity
      .bind(crmController)
  );

  app.post(
    "/api/v1/crm/opportunities/:opportunityId/activities",
    {
      preHandler:
        requireCompanyAccess
    },
    crmController
      .createActivity
      .bind(crmController)
  );
}
