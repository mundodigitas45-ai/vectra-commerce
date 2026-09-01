import type {
  CompanyAiResponsesInput,
  ConnectOpenAiInput
} from "./company-integration.schemas";

import {
  companyIntegrationRepository
} from "./company-integration.repository";

type CodedError = Error & {
  code?: string;
  httpStatus?: number;
};

function codedError(
  code: string,
  message: string,
  httpStatus?: number
): CodedError {
  const error = new Error(message) as CodedError;

  error.code = code;
  error.httpStatus = httpStatus;

  return error;
}

function safeErrorMessage(error: unknown) {
  if (
    error instanceof Error &&
    error.message
  ) {
    return error.message;
  }

  return "Falha desconhecida.";
}

async function validateOpenAiKey(
  apiKey: string
) {
  const controller = new AbortController();

  const timeout = setTimeout(
    () => controller.abort(),
    15000
  );

  try {
    const response = await fetch(
      "https://api.openai.com/v1/models",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: "application/json"
        },
        signal: controller.signal
      }
    );

    if (response.status === 401) {
      throw codedError(
        "OPENAI_KEY_INVALID",
        "A chave OpenAI informada é inválida.",
        401
      );
    }

    if (response.status === 403) {
      throw codedError(
        "OPENAI_KEY_FORBIDDEN",
        "A chave OpenAI não possui permissão para acessar a API.",
        403
      );
    }

    if (response.status === 429) {
      throw codedError(
        "OPENAI_RATE_LIMITED",
        "A conta OpenAI está sem cota disponível ou temporariamente limitada.",
        429
      );
    }

    if (!response.ok) {
      throw codedError(
        "OPENAI_VALIDATION_FAILED",
        "A OpenAI não confirmou esta chave no momento.",
        response.status
      );
    }

    const payload =
      await response.json() as {
        data?: unknown[];
      };

    return {
      valid: true,
      models_available:
        Array.isArray(payload.data)
          ? payload.data.length
          : null,
      validated_at:
        new Date().toISOString()
    };
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      error.name === "AbortError"
    ) {
      throw codedError(
        "OPENAI_VALIDATION_TIMEOUT",
        "A OpenAI demorou demais para validar a chave.",
        504
      );
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export class CompanyIntegrationService {
  async list(companyId: string) {
    const [
      integrations,
      openAiEntitlement
    ] = await Promise.all([
      companyIntegrationRepository.list(
        companyId
      ),
      companyIntegrationRepository
        .assertOpenAiFeature(companyId)
        .then((feature) => ({
          available: true,
          limit: feature.limit
        }))
        .catch(() => ({
          available: false,
          limit: null
        }))
    ]);

    const openAi =
      integrations.find(
        (item) =>
          item.provider === "openai" &&
          item.integration_type ===
            "api_key"
      ) ?? null;

    return {
      entitlements: {
        openai: openAiEntitlement
      },
      integrations,
      openai: openAi ?? {
        provider: "openai",
        integration_type: "api_key",
        name: "OpenAI",
        configured: false,
        is_enabled: false,
        status: "not_configured",
        public_config: {},
        last_validated_at: null,
        last_error: null
      }
    };
  }

  async connectOpenAi(
    companyId: string,
    userId: string,
    input: ConnectOpenAiInput
  ) {
    await companyIntegrationRepository
      .assertOpenAiFeature(companyId);

    /*
     * Validamos antes de armazenar.
     * Uma chave inválida nunca entra no Vault.
     */
    const validation =
      await validateOpenAiKey(
        input.api_key
      );

    const integration =
      await companyIntegrationRepository
        .upsertOpenAi(
          companyId,
          userId,
          input
        );

    try {
      await companyIntegrationRepository
        .setOpenAiSecret(
          companyId,
          integration.id,
          input.api_key
        );

      const connected =
        await companyIntegrationRepository
          .markOpenAiState(
            companyId,
            integration.id,
            {
              status: "connected",
              enabled: true,
              lastError: null,
              validatedAt:
                validation.validated_at
            }
          );

      return {
        id: connected.id,
        provider: connected.provider,
        integration_type:
          connected.integration_type,
        name: connected.name,
        public_config:
          connected.public_config ?? {},
        configured: true,
        is_enabled:
          connected.is_enabled,
        status: connected.status,
        last_validated_at:
          connected.last_validated_at,
        last_error:
          connected.last_error,
        models_available:
          validation.models_available
      };
    } catch (error: unknown) {
      await companyIntegrationRepository
        .markOpenAiState(
          companyId,
          integration.id,
          {
            status: "error",
            enabled: false,
            lastError:
              "Não foi possível armazenar a credencial."
          }
        )
        .catch(() => undefined);

      throw error;
    }
  }

  async testOpenAi(companyId: string) {
    await companyIntegrationRepository
      .assertOpenAiFeature(companyId);

    const integration =
      await companyIntegrationRepository
        .getOpenAi(companyId);

    if (!integration) {
      throw codedError(
        "OPENAI_NOT_CONFIGURED",
        "A OpenAI ainda não foi conectada.",
        404
      );
    }

    const apiKey =
      await companyIntegrationRepository
        .readOpenAiSecret(
          companyId,
          integration.id
        );

    try {
      const validation =
        await validateOpenAiKey(apiKey);

      await companyIntegrationRepository
        .markOpenAiState(
          companyId,
          integration.id,
          {
            status: "connected",
            enabled: true,
            lastError: null,
            validatedAt:
              validation.validated_at
          }
        );

      return {
        provider: "openai",
        configured: true,
        status: "connected",
        models_available:
          validation.models_available,
        validated_at:
          validation.validated_at
      };
    } catch (error: unknown) {
      const message =
        safeErrorMessage(error);

      await companyIntegrationRepository
        .markOpenAiState(
          companyId,
          integration.id,
          {
            status: "error",
            enabled: false,
            lastError: message,
            validatedAt:
              new Date().toISOString()
          }
        )
        .catch(() => undefined);

      throw error;
    }
  }

  async proxyOpenAiResponses(
    input: CompanyAiResponsesInput
  ) {
    await companyIntegrationRepository
      .assertOpenAiFeature(
        input.company_id
      );

    const integration =
      await companyIntegrationRepository
        .getOpenAi(input.company_id);

    if (
      !integration ||
      !integration.is_enabled ||
      integration.status ===
        "not_configured"
    ) {
      throw codedError(
        "OPENAI_NOT_CONFIGURED",
        "A OpenAI ainda não foi conectada para esta empresa.",
        409
      );
    }

    const apiKey =
      await companyIntegrationRepository
        .readOpenAiSecret(
          input.company_id,
          integration.id
        );

    const configuredModel =
      integration.public_config &&
      typeof integration.public_config
        .default_model === "string"
        ? integration.public_config
            .default_model
        : "gpt-4.1-mini";

    const requestedTokens =
      typeof input.request
        .max_output_tokens === "number"
        ? input.request.max_output_tokens
        : 1200;

    const safeRequest = {
      ...input.request,

      /*
       * A empresa controla o modelo pelo
       * painel, não pelo workflow.
       */
      model: configuredModel,

      /*
       * Limite técnico contra requisições
       * acidentais exageradas.
       */
      max_output_tokens:
        Math.max(
          1,
          Math.min(
            Math.trunc(requestedTokens),
            4000
          )
        )
    };

    const controller =
      new AbortController();

    const timeout = setTimeout(
      () => controller.abort(),
      90000
    );

    try {
      const response = await fetch(
        "https://api.openai.com/v1/responses",
        {
          method: "POST",
          headers: {
            Authorization:
              `Bearer ${apiKey}`,
            "Content-Type":
              "application/json",
            Accept:
              "application/json"
          },
          body:
            JSON.stringify(safeRequest),
          signal: controller.signal
        }
      );

      const raw =
        await response.text();

      let payload: unknown = raw;

      try {
        payload =
          raw ? JSON.parse(raw) : {};
      } catch {
        payload = {
          error: {
            code:
              "OPENAI_INVALID_RESPONSE",
            message:
              "A OpenAI retornou uma resposta inválida."
          }
        };
      }

      const now =
        new Date().toISOString();

      if (response.ok) {
        await companyIntegrationRepository
          .markOpenAiState(
            input.company_id,
            integration.id,
            {
              status: "connected",
              enabled: true,
              lastError: null,
              validatedAt: now
            }
          );
      } else {
        const authFailure =
          response.status === 401 ||
          response.status === 403;

        const rateLimited =
          response.status === 429;

        const safeMessage =
          authFailure
            ? "A credencial OpenAI foi recusada."
            : rateLimited
              ? "A conta OpenAI está sem cota ou temporariamente limitada."
              : `A OpenAI retornou HTTP ${response.status}.`;

        await companyIntegrationRepository
          .markOpenAiState(
            input.company_id,
            integration.id,
            {
              status: "error",
              enabled: !authFailure,
              lastError: safeMessage,
              validatedAt: now
            }
          )
          .catch(() => undefined);
      }

      return {
        status: response.status,
        payload
      };
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        error.name === "AbortError"
      ) {
        throw codedError(
          "OPENAI_REQUEST_TIMEOUT",
          "A OpenAI excedeu o tempo de resposta.",
          504
        );
      }

      throw codedError(
        "OPENAI_REQUEST_FAILED",
        "Não foi possível acessar a OpenAI.",
        502
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  async disconnectOpenAi(
    companyId: string
  ) {
    await companyIntegrationRepository
      .assertOpenAiFeature(companyId);

    return companyIntegrationRepository
      .removeOpenAi(companyId);
  }
}

export const companyIntegrationService =
  new CompanyIntegrationService();
