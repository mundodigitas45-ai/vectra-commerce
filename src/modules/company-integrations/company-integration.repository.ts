import { supabase } from "../../config/supabase";

import type {
  ConnectOpenAiInput
} from "./company-integration.schemas";

const OPENAI_PROVIDER = "openai";
const OPENAI_TYPE = "api_key";
const OPENAI_SECRET_TYPE = "openai_api_key";
const OPENAI_FEATURE = "byok_openai";

type IntegrationStatus =
  | "not_configured"
  | "configured"
  | "validating"
  | "connected"
  | "error"
  | "disabled";

type IntegrationRow = {
  id: string;
  company_id: string;
  provider: string;
  integration_type: string;
  name: string;
  public_config: Record<string, unknown> | null;
  is_enabled: boolean;
  status: IntegrationStatus;
  last_validated_at: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
};

function codedError(
  code: string,
  message: string
) {
  const error = new Error(message) as Error & {
    code?: string;
  };

  error.code = code;

  return error;
}

export class CompanyIntegrationRepository {
  async assertFeature(
    companyId: string,
    featureKey: string
  ) {
    const {
      data: subscription,
      error: subscriptionError
    } = await supabase
      .from("company_subscriptions")
      .select("id,plan_id,status,plan_snapshot")
      .eq("company_id", companyId)
      .in("status", ["trialing", "active"])
      .order("created_at", {
        ascending: false
      })
      .limit(1)
      .maybeSingle();

    if (subscriptionError) {
      throw new Error(
        subscriptionError.message
      );
    }

    if (!subscription) {
      throw codedError(
        "ACTIVE_SUBSCRIPTION_REQUIRED",
        "É necessário possuir uma assinatura ativa."
      );
    }

    const { data: feature, error: featureError } =
      await supabase
        .from("saas_plan_features")
        .select(
          "feature_key,is_enabled,limit_value,configuration"
        )
        .eq("plan_id", subscription.plan_id)
        .eq("feature_key", featureKey)
        .eq("is_enabled", true)
        .maybeSingle();

    if (featureError) {
      throw new Error(featureError.message);
    }

    if (!feature) {
      throw codedError(
        "INTEGRATION_FEATURE_NOT_INCLUDED",
        "Esta integração não está incluída no plano atual."
      );
    }

    return {
      subscription_id: subscription.id,
      plan_id: subscription.plan_id,
      feature_key: feature.feature_key,
      limit: feature.limit_value,
      configuration:
        feature.configuration ?? {}
    };
  }

  async list(companyId: string) {
    const { data, error } = await supabase
      .from("company_integrations")
      .select(
        "id,company_id,provider,integration_type,name,public_config,is_enabled,status,last_validated_at,last_error,created_at,updated_at"
      )
      .eq("company_id", companyId)
      .order("created_at", {
        ascending: true
      });

    if (error) {
      throw new Error(error.message);
    }

    const rows = (data ?? []) as IntegrationRow[];
    const ids = rows.map((row) => row.id);

    let configuredIds = new Set<string>();

    if (ids.length > 0) {
      const {
        data: references,
        error: referenceError
      } = await supabase
        .from("company_integration_secrets")
        .select(
          "company_integration_id,secret_type"
        )
        .eq("company_id", companyId)
        .in("company_integration_id", ids);

      if (referenceError) {
        throw new Error(
          referenceError.message
        );
      }

      configuredIds = new Set(
        (references ?? []).map(
          (item) =>
            item.company_integration_id
        )
      );
    }

    return rows.map((row) => ({
      id: row.id,
      provider: row.provider,
      integration_type:
        row.integration_type,
      name: row.name,
      public_config:
        row.public_config ?? {},
      is_enabled: row.is_enabled,
      status: row.status,
      configured:
        configuredIds.has(row.id),
      last_validated_at:
        row.last_validated_at,
      last_error: row.last_error,
      created_at: row.created_at,
      updated_at: row.updated_at
    }));
  }

  async getOpenAi(companyId: string) {
    const { data, error } = await supabase
      .from("company_integrations")
      .select(
        "id,company_id,provider,integration_type,name,public_config,is_enabled,status,last_validated_at,last_error,created_at,updated_at"
      )
      .eq("company_id", companyId)
      .eq("provider", OPENAI_PROVIDER)
      .eq("integration_type", OPENAI_TYPE)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data as IntegrationRow | null;
  }

  async upsertOpenAi(
    companyId: string,
    userId: string,
    input: ConnectOpenAiInput
  ) {
    const existing =
      await this.getOpenAi(companyId);

    if (existing) {
      const { data, error } = await supabase
        .from("company_integrations")
        .update({
          name: "OpenAI",
          public_config: {
            default_model:
              input.default_model,
            billing:
              "customer"
          },
          status: "validating",
          last_error: null
        })
        .eq("id", existing.id)
        .eq("company_id", companyId)
        .select(
          "id,company_id,provider,integration_type,name,public_config,is_enabled,status,last_validated_at,last_error,created_at,updated_at"
        )
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data as IntegrationRow;
    }

    const { data, error } = await supabase
      .from("company_integrations")
      .insert({
        company_id: companyId,
        provider: OPENAI_PROVIDER,
        integration_type: OPENAI_TYPE,
        name: "OpenAI",
        public_config: {
          default_model:
            input.default_model,
          billing:
            "customer"
        },
        is_enabled: false,
        status: "validating",
        created_by: userId
      })
      .select(
        "id,company_id,provider,integration_type,name,public_config,is_enabled,status,last_validated_at,last_error,created_at,updated_at"
      )
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data as IntegrationRow;
  }

  async setOpenAiSecret(
    companyId: string,
    integrationId: string,
    apiKey: string
  ) {
    const { data: existing, error } =
      await supabase
        .from("company_integration_secrets")
        .select("id")
        .eq("company_id", companyId)
        .eq(
          "company_integration_id",
          integrationId
        )
        .eq(
          "secret_type",
          OPENAI_SECRET_TYPE
        )
        .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    const rpc = existing
      ? "update_company_integration_secret"
      : "create_company_integration_secret";

    const { error: rpcError } =
      await supabase.rpc(rpc, {
        p_company_id: companyId,
        p_company_integration_id:
          integrationId,
        p_secret_type:
          OPENAI_SECRET_TYPE,
        p_secret_value: apiKey
      });

    if (rpcError) {
      throw new Error(rpcError.message);
    }
  }

  async readOpenAiSecret(
    companyId: string,
    integrationId: string
  ) {
    const { data, error } =
      await supabase.rpc(
        "read_company_integration_secret",
        {
          p_company_id: companyId,
          p_company_integration_id:
            integrationId,
          p_secret_type:
            OPENAI_SECRET_TYPE
        }
      );

    if (error) {
      throw codedError(
        "OPENAI_NOT_CONFIGURED",
        "A chave OpenAI ainda não foi configurada."
      );
    }

    if (
      typeof data !== "string" ||
      !data.trim()
    ) {
      throw codedError(
        "OPENAI_NOT_CONFIGURED",
        "A chave OpenAI ainda não foi configurada."
      );
    }

    return data;
  }

  async markOpenAiState(
    companyId: string,
    integrationId: string,
    input: {
      status: IntegrationStatus;
      enabled: boolean;
      lastError: string | null;
      validatedAt?: string | null;
    }
  ) {
    const patch: Record<string, unknown> = {
      status: input.status,
      is_enabled: input.enabled,
      last_error: input.lastError
    };

    if (input.validatedAt !== undefined) {
      patch.last_validated_at =
        input.validatedAt;
    }

    const { data, error } = await supabase
      .from("company_integrations")
      .update(patch)
      .eq("id", integrationId)
      .eq("company_id", companyId)
      .select(
        "id,company_id,provider,integration_type,name,public_config,is_enabled,status,last_validated_at,last_error,created_at,updated_at"
      )
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      throw codedError(
        "COMPANY_INTEGRATION_NOT_FOUND",
        "Integração não encontrada."
      );
    }

    return data as IntegrationRow;
  }

  async removeOpenAi(
    companyId: string
  ) {
    const integration =
      await this.getOpenAi(companyId);

    if (!integration) {
      throw codedError(
        "COMPANY_INTEGRATION_NOT_FOUND",
        "Integração OpenAI não encontrada."
      );
    }

    const { error: secretError } =
      await supabase.rpc(
        "delete_all_company_integration_secrets",
        {
          p_company_id: companyId,
          p_company_integration_id:
            integration.id
        }
      );

    if (secretError) {
      throw new Error(secretError.message);
    }

    const { error } = await supabase
      .from("company_integrations")
      .delete()
      .eq("id", integration.id)
      .eq("company_id", companyId);

    if (error) {
      throw new Error(error.message);
    }

    return {
      provider: OPENAI_PROVIDER,
      configured: false,
      status: "not_configured"
    };
  }

  assertOpenAiFeature(companyId: string) {
    return this.assertFeature(
      companyId,
      OPENAI_FEATURE
    );
  }
}

export const companyIntegrationRepository =
  new CompanyIntegrationRepository();
