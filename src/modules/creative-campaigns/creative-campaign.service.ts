import type {
  CreateCreativeCampaignInput,
  RequestCreativeGenerationInput
} from "./creative-campaign.schemas";
import { creativeCampaignRepository } from "./creative-campaign.repository";

export class CreativeCampaignService {
  list(companyId: string) {
    return creativeCampaignRepository.list(
      companyId
    );
  }

  getById(
    companyId: string,
    campaignId: string
  ) {
    return creativeCampaignRepository.getById(
      companyId,
      campaignId
    );
  }

  create(
    companyId: string,
    userId: string,
    input: CreateCreativeCampaignInput
  ) {
    return creativeCampaignRepository.create(
      companyId,
      userId,
      input
    );
  }

  enqueueGeneration(
    companyId: string,
    userId: string,
    campaignId: string,
    input: RequestCreativeGenerationInput
  ) {
    return creativeCampaignRepository.enqueueGeneration(
      companyId,
      userId,
      campaignId,
      input
    );
  }
}

export const creativeCampaignService =
  new CreativeCampaignService();
