import { supabase } from "../../config/supabase";

import type {
  CreateSiteIntegrationInput,
  UpdateSiteIntegrationInput,
  SetMetaCapiSecretInput
} from "./site-integration.schemas";

async function ensureSiteBelongsToCompany(
  companyId: string,
  siteId: string
) {
  const { data, error } = await supabase
    .from("sites")
    .select("id, company_id")
    .eq("id", siteId)
    .eq("company_id", companyId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    const err = new Error(
      "Site não encontrado para a empresa ativa."
    ) as Error & { code?: string };

    err.code = "SITE_NOT_FOUND";
    throw err;
  }

  return data;
}

const META_CAPI_SECRET_TYPE =
  "meta_capi_access_token";

async function ensureIntegrationBelongsToSiteCompany(
  companyId: string,
  siteId: string,
  integrationId: string
) {
  await ensureSiteBelongsToCompany(
    companyId,
    siteId
  );

  const { data, error } = await supabase
    .from("site_integrations")
    .select(
      "id, company_id, site_id, provider, integration_type"
    )
    .eq("id", integrationId)
    .eq("company_id", companyId)
    .eq("site_id", siteId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    const err = new Error(
      "Integração não encontrada."
    ) as Error & { code?: string };

    err.code =
      "SITE_INTEGRATION_NOT_FOUND";

    throw err;
  }

  if (
    data.provider !== "meta" ||
    data.integration_type !== "pixel"
  ) {
    const err = new Error(
      "CAPI está disponível apenas para integração Meta Pixel."
    ) as Error & { code?: string };

    err.code =
      "INTEGRATION_CAPI_UNSUPPORTED";

    throw err;
  }

  return data;
}

async function deleteAllIntegrationSecrets(
  companyId: string,
  integrationId: string
) {
  const { data, error } = await supabase
    .from("site_integration_secrets")
    .select("secret_type")
    .eq("company_id", companyId)
    .eq(
      "site_integration_id",
      integrationId
    );

  if (error) {
    throw new Error(error.message);
  }

  for (const item of data ?? []) {
    const { error: deleteError } =
      await supabase.rpc(
        "delete_site_integration_secret",
        {
          p_company_id: companyId,
          p_site_integration_id:
            integrationId,
          p_secret_type:
            item.secret_type
        }
      );

    if (deleteError) {
      throw new Error(
        deleteError.message
      );
    }
  }
}

export class SiteIntegrationRepository {
  async list(
    companyId: string,
    siteId: string
  ) {
    await ensureSiteBelongsToCompany(
      companyId,
      siteId
    );

    const { data, error } = await supabase
      .from("site_integrations")
      .select(
        "id, company_id, site_id, provider, integration_type, name, public_config, is_enabled, status, last_tested_at, last_error, created_at, updated_at"
      )
      .eq("company_id", companyId)
      .eq("site_id", siteId)
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
    siteId: string,
    input: CreateSiteIntegrationInput
  ) {
    await ensureSiteBelongsToCompany(
      companyId,
      siteId
    );

    const { data, error } = await supabase
      .from("site_integrations")
      .insert({
        company_id: companyId,
        site_id: siteId,
        provider: input.provider,
        integration_type:
          input.integration_type,
        name:
          input.name ??
          "Meta Pixel",
        public_config:
          input.public_config,
        is_enabled:
          input.is_enabled,
        status:
          input.is_enabled
            ? "configured"
            : "disabled"
      })
      .select(
        "id, company_id, site_id, provider, integration_type, name, public_config, is_enabled, status, last_tested_at, last_error, created_at, updated_at"
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

  async update(
    companyId: string,
    siteId: string,
    integrationId: string,
    input: UpdateSiteIntegrationInput
  ) {
    await ensureSiteBelongsToCompany(
      companyId,
      siteId
    );

    const patch: Record<string, unknown> = {};

    if (input.name !== undefined) {
      patch.name = input.name;
    }

    if (input.public_config !== undefined) {
      patch.public_config =
        input.public_config;
    }

    if (input.is_enabled !== undefined) {
      patch.is_enabled =
        input.is_enabled;

      patch.status =
        input.is_enabled
          ? "configured"
          : "disabled";

      if (input.is_enabled) {
        patch.last_error = null;
      }
    }

    const { data, error } = await supabase
      .from("site_integrations")
      .update(patch)
      .eq("id", integrationId)
      .eq("company_id", companyId)
      .eq("site_id", siteId)
      .select(
        "id, company_id, site_id, provider, integration_type, name, public_config, is_enabled, status, last_tested_at, last_error, created_at, updated_at"
      )
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      const err = new Error(
        "Integração não encontrada."
      ) as Error & { code?: string };

      err.code =
        "SITE_INTEGRATION_NOT_FOUND";
      throw err;
    }

    return data;
  }

  async getCapiStatus(
    companyId: string,
    siteId: string,
    integrationId: string
  ) {
    await ensureIntegrationBelongsToSiteCompany(
      companyId,
      siteId,
      integrationId
    );

    const { data, error } = await supabase
      .from("site_integration_secrets")
      .select("id")
      .eq("company_id", companyId)
      .eq(
        "site_integration_id",
        integrationId
      )
      .eq(
        "secret_type",
        META_CAPI_SECRET_TYPE
      )
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return {
      capi_configured: Boolean(data)
    };
  }

  async setCapiSecret(
    companyId: string,
    siteId: string,
    integrationId: string,
    input: SetMetaCapiSecretInput
  ) {
    await ensureIntegrationBelongsToSiteCompany(
      companyId,
      siteId,
      integrationId
    );

    const { data: existing, error } =
      await supabase
        .from("site_integration_secrets")
        .select("id")
        .eq("company_id", companyId)
        .eq(
          "site_integration_id",
          integrationId
        )
        .eq(
          "secret_type",
          META_CAPI_SECRET_TYPE
        )
        .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (existing) {
      const { error: updateError } =
        await supabase.rpc(
          "update_site_integration_secret",
          {
            p_company_id: companyId,
            p_site_integration_id:
              integrationId,
            p_secret_type:
              META_CAPI_SECRET_TYPE,
            p_secret_value:
              input.access_token
          }
        );

      if (updateError) {
        throw new Error(
          updateError.message
        );
      }
    } else {
      const { error: createError } =
        await supabase.rpc(
          "create_site_integration_secret",
          {
            p_company_id: companyId,
            p_site_integration_id:
              integrationId,
            p_secret_type:
              META_CAPI_SECRET_TYPE,
            p_secret_value:
              input.access_token
          }
        );

      if (createError) {
        /*
         * Proteção para concorrência:
         * se outra requisição criou entre
         * o SELECT e o INSERT, atualizamos.
         */
        if (
          createError.message.includes(
            "SECRET_ALREADY_EXISTS"
          )
        ) {
          const {
            error: retryError
          } = await supabase.rpc(
            "update_site_integration_secret",
            {
              p_company_id: companyId,
              p_site_integration_id:
                integrationId,
              p_secret_type:
                META_CAPI_SECRET_TYPE,
              p_secret_value:
                input.access_token
            }
          );

          if (retryError) {
            throw new Error(
              retryError.message
            );
          }
        } else {
          throw new Error(
            createError.message
          );
        }
      }
    }

    return {
      capi_configured: true
    };
  }

  async deleteCapiSecret(
    companyId: string,
    siteId: string,
    integrationId: string
  ) {
    await ensureIntegrationBelongsToSiteCompany(
      companyId,
      siteId,
      integrationId
    );

    const { error } = await supabase.rpc(
      "delete_site_integration_secret",
      {
        p_company_id: companyId,
        p_site_integration_id:
          integrationId,
        p_secret_type:
          META_CAPI_SECRET_TYPE
      }
    );

    if (error) {
      throw new Error(error.message);
    }

    return {
      capi_configured: false
    };
  }

  async remove(
    companyId: string,
    siteId: string,
    integrationId: string
  ) {
    await ensureIntegrationBelongsToSiteCompany(
      companyId,
      siteId,
      integrationId
    );

    /*
     * Remove todos os segredos do Vault
     * antes de excluir a integração.
     * Evita secrets órfãos no Vault.
     */
    await deleteAllIntegrationSecrets(
      companyId,
      integrationId
    );

    const { data, error } = await supabase
      .from("site_integrations")
      .delete()
      .eq("id", integrationId)
      .eq("company_id", companyId)
      .eq("site_id", siteId)
      .select("id")
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      const err = new Error(
        "Integração não encontrada."
      ) as Error & { code?: string };

      err.code =
        "SITE_INTEGRATION_NOT_FOUND";
      throw err;
    }

    return {
      id: data.id
    };
  }
}

export const siteIntegrationRepository =
  new SiteIntegrationRepository();
