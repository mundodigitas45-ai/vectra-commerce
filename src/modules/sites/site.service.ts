import type { CreateSiteInput } from "./site.schemas";
import { siteRepository } from "./site.repository";

export class SiteService {
  async list(companyId: string) {
    return siteRepository.list(companyId);
  }

  async create(
    companyId: string,
    input: CreateSiteInput
  ) {
    return siteRepository.create(
      companyId,
      input
    );
  }
}

export const siteService =
  new SiteService();
