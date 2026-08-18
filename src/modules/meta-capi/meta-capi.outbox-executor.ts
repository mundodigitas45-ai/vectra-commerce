import {
  supabase
} from "../../config/supabase";

import {
  MetaCapiProcessor,
  metaCapiProcessor
} from "./meta-capi.processor";

type OutboxRow = {
  id: string;
  company_id: string;
  site_id: string;
  order_id: string;
  event_id: string;
  event_name: string;
  status: string;
  attempt_count: number;
};

type ExecutorDependencies = {
  processor?: MetaCapiProcessor;
};

export type MetaCapiBatchResult = {
  claimed: number;
  sent: number;
  failed: number;
  results: Array<{
    outbox_id: string;
    status: "sent" | "failed";
  }>;
};

function sanitizeError(
  error: unknown
): string {
  let message =
    error instanceof Error
      ? error.message
      : "META_CAPI_PROCESSING_FAILED";

  /*
   * Defesa adicional contra vazamento acidental
   * de credenciais em mensagens de erro.
   */
  message = message
    .replace(
      /Bearer\s+[^\s]+/gi,
      "Bearer [REDACTED]"
    )
    .replace(
      /access_token=([^&\s]+)/gi,
      "access_token=[REDACTED]"
    );

  return message
    .slice(0, 2000);
}

export class MetaCapiOutboxExecutor {
  private readonly processor:
    MetaCapiProcessor;

  constructor(
    dependencies:
      ExecutorDependencies = {}
  ) {
    this.processor =
      dependencies.processor ??
      metaCapiProcessor;
  }

  async runBatch(
    limit = 10
  ): Promise<MetaCapiBatchResult> {
    if (
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 100
    ) {
      throw new Error(
        "META_OUTBOX_LIMIT_INVALID"
      );
    }

    const {
      data,
      error: claimError
    } = await supabase.rpc(
      "claim_meta_events",
      {
        p_limit: limit
      }
    );

    if (claimError) {
      throw new Error(
        `META_OUTBOX_CLAIM_FAILED: ${claimError.message}`
      );
    }

    const claimed =
      Array.isArray(data)
        ? data as OutboxRow[]
        : [];

    const result:
      MetaCapiBatchResult = {
        claimed:
          claimed.length,

        sent:
          0,

        failed:
          0,

        results:
          []
      };

    for (
      const event of claimed
    ) {
      /*
       * FASE 1 — transmissão.
       *
       * Somente uma falha nesta fase significa
       * que podemos registrar o evento como
       * failed/retry.
       */
      try {
        await this.processor
          .processPurchase(
            event.id
          );

      } catch (error) {
        const safeError =
          sanitizeError(
            error
          );

        const {
          error: failedError
        } = await supabase.rpc(
          "mark_meta_event_failed",
          {
            p_event_id:
              event.id,

            p_error:
              safeError
          }
        );

        if (failedError) {
          /*
           * Nem a falha pôde ser persistida.
           * O stale-lock poderá recuperar
           * o evento posteriormente.
           */
          throw new Error(
            `META_OUTBOX_MARK_FAILED_FAILED: ${failedError.message}`
          );
        }

        result.failed += 1;

        result.results.push({
          outbox_id:
            event.id,
          status:
            "failed"
        });

        continue;
      }

      /*
       * FASE 2 — confirmação local.
       *
       * Aqui o envio remoto JÁ terminou com
       * sucesso.
       *
       * Se o banco não conseguir marcar sent,
       * NÃO podemos transformar isso em
       * "failed", pois a Meta pode já ter
       * aceitado o Purchase.
       *
       * Mantemos processing. O mecanismo de
       * stale lock poderá recuperar depois,
       * sempre reutilizando o mesmo event_id.
       */
      const {
        error: sentError
      } = await supabase.rpc(
        "mark_meta_event_sent",
        {
          p_event_id:
            event.id
        }
      );

      if (sentError) {
        throw new Error(
          `META_OUTBOX_ACK_PERSIST_FAILED: ${sentError.message}`
        );
      }

      result.sent += 1;

      result.results.push({
        outbox_id:
          event.id,
        status:
          "sent"
      });
    }

    return result;
  }
}

export const metaCapiOutboxExecutor =
  new MetaCapiOutboxExecutor();
