import { supabase } from "../../config/supabase";
import type {
  PublicAnalyticsEventInput
} from "./site-analytics.schemas";

function normalizeDomain(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//i, "")
    .replace(/\/.*$/, "")
    .replace(/\.$/, "");
}

export class SiteAnalyticsRepository {
  async registerEvent(input: PublicAnalyticsEventInput) {
    const domain = normalizeDomain(input.domain);

    const { data: site, error: siteError } =
      await supabase
        .from("sites")
        .select("id, company_id")
        .eq("domain", domain)
        .eq("is_active", true)
        .maybeSingle();

    if (siteError) {
      throw new Error(siteError.message);
    }

    if (!site) {
      const error = new Error(
        "Site não encontrado ou desativado."
      ) as Error & { code?: string };

      error.code = "SITE_NOT_FOUND";
      throw error;
    }

    const now = new Date().toISOString();

    const sessionPayload = {
      company_id: site.company_id,
      site_id: site.id,
      visitor_id: input.visitor_id,
      session_id: input.session_id,
      last_seen_at: now,
      current_path: input.page_path,
      current_title: input.page_title ?? null,
      product_id: input.product_id ?? null,
      product_name: input.product_name ?? null,
      referrer_domain: input.referrer_domain ?? null,
      utm_source: input.utm_source ?? null,
      utm_medium: input.utm_medium ?? null,
      utm_campaign: input.utm_campaign ?? null
    };

    const { error: sessionError } =
      await supabase
        .from("site_analytics_sessions")
        .upsert(sessionPayload, {
          onConflict: "site_id,session_id",
          ignoreDuplicates: false
        });

    if (sessionError) {
      throw new Error(sessionError.message);
    }

    if (input.event_name !== "heartbeat") {
      const { error: eventError } =
        await supabase
          .from("site_analytics_events")
          .insert({
            company_id: site.company_id,
            site_id: site.id,
            visitor_id: input.visitor_id,
            session_id: input.session_id,
            event_name: input.event_name,
            page_path: input.page_path,
            page_title: input.page_title ?? null,
            product_id: input.product_id ?? null,
            product_name: input.product_name ?? null,
            referrer_domain:
              input.referrer_domain ?? null,
            utm_source: input.utm_source ?? null,
            utm_medium: input.utm_medium ?? null,
            utm_campaign:
              input.utm_campaign ?? null,
            occurred_at: now
          });

      if (eventError) {
        throw new Error(eventError.message);
      }
    }

    return {
      accepted: true,
      recorded_at: now
    };
  }

  async summary(
    companyId: string,
    siteId: string,
    days: number
  ) {
    const { data: site, error: siteError } =
      await supabase
        .from("sites")
        .select("id, name, domain")
        .eq("id", siteId)
        .eq("company_id", companyId)
        .eq("is_active", true)
        .maybeSingle();

    if (siteError) {
      throw new Error(siteError.message);
    }

    if (!site) {
      const error = new Error(
        "Site não encontrado nesta empresa."
      ) as Error & { code?: string };

      error.code = "SITE_NOT_FOUND";
      throw error;
    }

    const { data, error } = await supabase.rpc(
      "get_site_analytics_summary",
      {
        p_company_id: companyId,
        p_site_id: siteId,
        p_days: days
      }
    );

    if (error) {
      throw new Error(error.message);
    }

    return {
      site,
      ...(data && typeof data === "object" ? data : {})
    };
  }
}

export const siteAnalyticsRepository =
  new SiteAnalyticsRepository();
