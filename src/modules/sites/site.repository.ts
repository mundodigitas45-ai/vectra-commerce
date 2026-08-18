import { supabase } from "../../config/supabase";
import type { CreateSiteInput } from "./site.schemas";

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

function normalizeDomain(value: string): string {
  let domain = value.trim().toLowerCase();

  domain = domain
    .replace(/^https?:\/\//i, "")
    .replace(/\/.*$/, "")
    .replace(/\.$/, "");

  return domain;
}

export class SiteRepository {
  async list(companyId: string) {
    const { data, error } = await supabase
      .from("sites")
      .select(
        "id, company_id, store_id, name, slug, domain, base_url, environment, is_active, settings, created_at, updated_at"
      )
      .eq("company_id", companyId)
      .order("created_at", {
        ascending: false
      });

    if (error) {
      throw new Error(error.message);
    }

    return data ?? [];
  }

  async create(
    companyId: string,
    input: CreateSiteInput
  ) {
    const domain = normalizeDomain(
      input.domain
    );

    if (!domain || !domain.includes(".")) {
      const error = new Error(
        "Domínio inválido."
      ) as Error & { code?: string };

      error.code = "INVALID_DOMAIN";
      throw error;
    }

    if (input.store_id) {
      const { data: store, error: storeError } =
        await supabase
          .from("stores")
          .select("id, company_id")
          .eq("id", input.store_id)
          .eq("company_id", companyId)
          .maybeSingle();

      if (storeError) {
        throw new Error(
          storeError.message
        );
      }

      if (!store) {
        const error = new Error(
          "A loja informada não pertence à empresa ativa."
        ) as Error & { code?: string };

        error.code = "STORE_ACCESS_DENIED";
        throw error;
      }
    }

    let slug = slugify(input.name);

    if (!slug) {
      slug = slugify(domain);
    }

    const baseUrl =
      input.base_url?.trim() ||
      `https://${domain}`;

    const { data, error } = await supabase
      .from("sites")
      .insert({
        company_id: companyId,
        store_id: input.store_id ?? null,
        name: input.name.trim(),
        slug,
        domain,
        base_url: baseUrl,
        environment: input.environment,
        is_active: input.is_active,
        settings: {}
      })
      .select(
        "id, company_id, store_id, name, slug, domain, base_url, environment, is_active, settings, created_at, updated_at"
      )
      .single();

    if (error) {
      const wrapped = new Error(
        error.message
      ) as Error & { code?: string };

      wrapped.code = error.code;
      throw wrapped;
    }

    return data;
  }
}

export const siteRepository =
  new SiteRepository();

export async function getPublicSiteConfigByDomain(
  rawDomain: string
) {
  const domain = rawDomain
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//i, "")
    .replace(/\/.*$/, "")
    .replace(/\.$/, "");

  const { data: site, error: siteError } =
    await supabase
      .from("sites")
      .select(
        "id, company_id, name, domain, environment, is_active"
      )
      .eq("domain", domain)
      .eq("is_active", true)
      .maybeSingle();

  if (siteError) {
    throw new Error(siteError.message);
  }

  if (!site) {
    return null;
  }

  const {
    data: integrations,
    error: integrationsError
  } = await supabase
    .from("site_integrations")
    .select(
      "provider, integration_type, public_config, is_enabled, status"
    )
    .eq("company_id", site.company_id)
    .eq("site_id", site.id)
    .eq("is_enabled", true);

  if (integrationsError) {
    throw new Error(
      integrationsError.message
    );
  }

  const safeIntegrations =
    (integrations ?? [])
      .map((integration) => {
        if (
          integration.provider === "meta" &&
          integration.integration_type === "pixel"
        ) {
          const pixelId =
            integration.public_config &&
            typeof integration.public_config === "object" &&
            !Array.isArray(integration.public_config)
              ? (
                  integration.public_config as {
                    pixel_id?: unknown;
                  }
                ).pixel_id
              : undefined;

          if (
            typeof pixelId !== "string" ||
            !pixelId.trim()
          ) {
            return null;
          }

          return {
            provider: "meta",
            integration_type: "pixel",
            is_enabled: true,
            public_config: {
              pixel_id: pixelId.trim()
            }
          };
        }

        return null;
      })
      .filter(Boolean);

  return {
    site: {
      id: site.id,
      name: site.name,
      domain: site.domain,
      environment: site.environment
    },
    integrations: safeIntegrations
  };
}
