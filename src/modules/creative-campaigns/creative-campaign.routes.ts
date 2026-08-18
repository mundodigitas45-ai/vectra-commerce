import type { FastifyInstance } from "fastify";
import { requireCompanyAccess } from "../auth/company-context.auth";
import { creativeCampaignController } from "./creative-campaign.controller";
import type {
  CreateCreativeCampaignInput,
  RequestCreativeGenerationInput
} from "./creative-campaign.schemas";

interface CampaignParams {
  campaignId: string;
}

export async function creativeCampaignRoutes(
  app: FastifyInstance
) {
  app.get(
    "/api/v1/creative-campaigns",
    {
      preHandler: requireCompanyAccess
    },
    creativeCampaignController.list.bind(
      creativeCampaignController
    )
  );

  app.get<{
    Params: CampaignParams;
  }>(
    "/api/v1/creative-campaigns/:campaignId",
    {
      preHandler: requireCompanyAccess
    },
    creativeCampaignController.getById.bind(
      creativeCampaignController
    )
  );

  app.post<{
    Body: CreateCreativeCampaignInput;
  }>(
    "/api/v1/creative-campaigns",
    {
      preHandler: requireCompanyAccess
    },
    creativeCampaignController.create.bind(
      creativeCampaignController
    )
  );

  app.post<{
    Params: CampaignParams;
    Body: RequestCreativeGenerationInput;
  }>(
    "/api/v1/creative-campaigns/:campaignId/generate",
    {
      preHandler: requireCompanyAccess
    },
    creativeCampaignController.generate.bind(
      creativeCampaignController
    )
  );
}
