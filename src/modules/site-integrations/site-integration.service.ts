import type {
  CreateSiteIntegrationInput,
  UpdateSiteIntegrationInput,
  SetMetaCapiSecretInput
} from "./site-integration.schemas";

import {
  siteIntegrationRepository
} from "./site-integration.repository";

export class SiteIntegrationService {
  list(
    companyId: string,
    siteId: string
  ) {
    return siteIntegrationRepository.list(
      companyId,
      siteId
    );
  }

  create(
    companyId: string,
    siteId: string,
    input: CreateSiteIntegrationInput
  ) {
    return siteIntegrationRepository.create(
      companyId,
      siteId,
      input
    );
  }

  update(
    companyId: string,
    siteId: string,
    integrationId: string,
    input: UpdateSiteIntegrationInput
  ) {
    return siteIntegrationRepository.update(
      companyId,
      siteId,
      integrationId,
      input
    );
  }

  getCapiStatus(
    companyId: string,
    siteId: string,
    integrationId: string
  ) {
    return siteIntegrationRepository
      .getCapiStatus(
        companyId,
        siteId,
        integrationId
      );
  }

  setCapiSecret(
    companyId: string,
    siteId: string,
    integrationId: string,
    input: SetMetaCapiSecretInput
  ) {
    return siteIntegrationRepository
      .setCapiSecret(
        companyId,
        siteId,
        integrationId,
        input
      );
  }

  deleteCapiSecret(
    companyId: string,
    siteId: string,
    integrationId: string
  ) {
    return siteIntegrationRepository
      .deleteCapiSecret(
        companyId,
        siteId,
        integrationId
      );
  }

  remove(
    companyId: string,
    siteId: string,
    integrationId: string
  ) {
    return siteIntegrationRepository.remove(
      companyId,
      siteId,
      integrationId
    );
  }
}

export const siteIntegrationService =
  new SiteIntegrationService();
