import { siteAnalyticsRepository } from "./site-analytics.repository";
import type {
  PublicAnalyticsEventInput
} from "./site-analytics.schemas";

export class SiteAnalyticsService {
  registerEvent(input: PublicAnalyticsEventInput) {
    return siteAnalyticsRepository.registerEvent(input);
  }

  summary(
    companyId: string,
    siteId: string,
    days: number
  ) {
    return siteAnalyticsRepository.summary(
      companyId,
      siteId,
      days
    );
  }
}

export const siteAnalyticsService =
  new SiteAnalyticsService();
