import {
  supabase
} from "../../config/supabase";

import {
  MetaCapiService,
  metaCapiService
} from "./meta-capi.service";

import {
  MetaCapiSender,
  metaCapiSender
} from "./meta-capi.sender";

const META_CAPI_SECRET_TYPE =
  "meta_capi_access_token";

type MetaCapiProcessorDependencies = {
  service?: MetaCapiService;
  sender?: MetaCapiSender;
};

export type MetaCapiProcessResult = {
  ok: true;
  outbox_id: string;
  event_id: string;
  pixel_id: string;
  http_status: number;
  events_received: number | null;
  fbtrace_id: string | null;
};

function createError(
  code: string,
  message: string
) {
  const error =
    new Error(message) as Error & {
      code?: string;
    };

  error.code = code;

  return error;
}

export class MetaCapiProcessor {
  private readonly service:
    MetaCapiService;

  private readonly sender:
    MetaCapiSender;

  constructor(
    dependencies:
      MetaCapiProcessorDependencies = {}
  ) {
    this.service =
      dependencies.service ??
      metaCapiService;

    this.sender =
      dependencies.sender ??
      metaCapiSender;
  }

  async processPurchase(
    outboxId: string
  ): Promise<MetaCapiProcessResult> {
    /*
     * O builder já executa todas as validações:
     *
     * - outbox
     * - pedido entregue
     * - empresa
     * - site
     * - integração Meta ativa
     * - Pixel ID
     * - token existente no Vault
     * - itens
     * - telefone normalizado/hash
     * - payload Purchase
     *
     * O retorno do builder NÃO contém
     * o access token.
     */
    const prepared =
      await this.service
        .buildPurchaseDryRun(
          outboxId
        );

    /*
     * O token é recuperado novamente apenas
     * dentro desta camada interna.
     *
     * Ele fica exclusivamente em memória e
     * nunca entra no retorno do processor.
     */
    const {
      data: accessToken,
      error: secretError
    } = await supabase.rpc(
      "get_site_integration_secret",
      {
        p_company_id:
          prepared.context.company_id,

        p_site_integration_id:
          prepared.context.integration_id,

        p_secret_type:
          META_CAPI_SECRET_TYPE
      }
    );

    if (secretError) {
      throw createError(
        "META_CAPI_SECRET_UNAVAILABLE",
        "Token CAPI indisponível."
      );
    }

    if (
      typeof accessToken !== "string" ||
      accessToken.trim().length < 20
    ) {
      throw createError(
        "META_CAPI_SECRET_INVALID",
        "Token CAPI inválido."
      );
    }

    /*
     * Único ponto desta camada onde
     * o access token é entregue ao sender.
     *
     * Não logar input.
     */
    const sendResult =
      await this.sender
        .sendPurchase({
          pixelId:
            prepared.context.pixel_id,

          accessToken,

          payload:
            prepared.payload
        });

    /*
     * Retorno seguro.
     *
     * NÃO contém:
     * - access token
     * - telefone puro
     * - telefone normalizado
     */
    return {
      ok: true,

      outbox_id:
        prepared.context.outbox_id,

      event_id:
        prepared.payload.event_id,

      pixel_id:
        prepared.context.pixel_id,

      http_status:
        sendResult.status,

      events_received:
        sendResult.events_received,

      fbtrace_id:
        sendResult.fbtrace_id
    };
  }
}

export const metaCapiProcessor =
  new MetaCapiProcessor();
