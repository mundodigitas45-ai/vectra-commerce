import type { FastifyInstance } from "fastify";
import { requireCompanyAccess } from "../auth/company-context.auth";
import { creativeCampaignController } from "./creative-campaign.controller";
import type {
  CreateCreativeCampaignInput,
  RequestCreativeGenerationInput,
  ReviewCreativeAssetInput
} from "./creative-campaign.schemas";

interface CampaignParams {
  campaignId: string;
}

interface AssetParams extends CampaignParams {
  assetId: string;
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

  app.get<{
    Params: CampaignParams;
  }>(
    "/api/v1/creative-campaigns/:campaignId/review",
    {
      preHandler: requireCompanyAccess
    },
    creativeCampaignController.getReview.bind(
      creativeCampaignController
    )
  );

  app.post<{
    Params: AssetParams;
    Body: ReviewCreativeAssetInput;
  }>(
    "/api/v1/creative-campaigns/:campaignId/assets/:assetId/review",
    {
      preHandler: requireCompanyAccess
    },
    creativeCampaignController.reviewAsset.bind(
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
