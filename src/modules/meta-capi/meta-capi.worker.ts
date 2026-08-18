import {
  MetaCapiOutboxExecutor,
  metaCapiOutboxExecutor
} from "./meta-capi.outbox-executor";

type WorkerExecutor = Pick<
  MetaCapiOutboxExecutor,
  "runBatch"
>;

type MetaCapiWorkerOptions = {
  enabled?: boolean;
  intervalMs?: number;
  batchSize?: number;
  executor?: WorkerExecutor;
};

export type MetaCapiWorkerStatus = {
  enabled: boolean;
  started: boolean;
  running: boolean;
  interval_ms: number;
  batch_size: number;
  last_run_started_at: string | null;
  last_run_finished_at: string | null;
  last_result: {
    claimed: number;
    sent: number;
    failed: number;
  } | null;
  last_error: string | null;
};

function envBoolean(
  value: string | undefined,
  fallback: boolean
): boolean {
  if (value === undefined) {
    return fallback;
  }

  return [
    "1",
    "true",
    "yes",
    "on"
  ].includes(
    value.trim().toLowerCase()
  );
}

function envInteger(
  value: string | undefined,
  fallback: number
): number {
  if (!value) {
    return fallback;
  }

  const parsed =
    Number.parseInt(
      value,
      10
    );

  return Number.isInteger(parsed)
    ? parsed
    : fallback;
}

function safeErrorMessage(
  error: unknown
): string {
  const message =
    error instanceof Error
      ? error.message
      : "META_CAPI_WORKER_FAILED";

  return message
    .replace(
      /Bearer\s+[^\s]+/gi,
      "Bearer [REDACTED]"
    )
    .replace(
      /access_token=([^&\s]+)/gi,
      "access_token=[REDACTED]"
    )
    .slice(0, 1000);
}

export class MetaCapiWorker {
  private readonly enabled:
    boolean;

  private readonly intervalMs:
    number;

  private readonly batchSize:
    number;

  private readonly executor:
    WorkerExecutor;

  private timer:
    NodeJS.Timeout | null =
      null;

  private started =
    false;

  private running =
    false;

  private lastRunStartedAt:
    string | null =
      null;

  private lastRunFinishedAt:
    string | null =
      null;

  private lastResult:
    MetaCapiWorkerStatus["last_result"] =
      null;

  private lastError:
    string | null =
      null;

  constructor(
    options:
      MetaCapiWorkerOptions = {}
  ) {
    this.enabled =
      options.enabled ??
      envBoolean(
        process.env
          .META_CAPI_WORKER_ENABLED,
        false
      );

    this.intervalMs =
      options.intervalMs ??
      envInteger(
        process.env
          .META_CAPI_WORKER_INTERVAL_MS,
        60000
      );

    this.batchSize =
      options.batchSize ??
      envInteger(
        process.env
          .META_CAPI_WORKER_BATCH_SIZE,
        5
      );

    this.executor =
      options.executor ??
      metaCapiOutboxExecutor;

    if (
      !Number.isInteger(
        this.intervalMs
      ) ||
      this.intervalMs < 10000
    ) {
      throw new Error(
        "META_CAPI_WORKER_INTERVAL_INVALID"
      );
    }

    if (
      !Number.isInteger(
        this.batchSize
      ) ||
      this.batchSize < 1 ||
      this.batchSize > 100
    ) {
      throw new Error(
        "META_CAPI_WORKER_BATCH_SIZE_INVALID"
      );
    }
  }

  start(): boolean {
    if (!this.enabled) {
      return false;
    }

    if (this.started) {
      return true;
    }

    this.started =
      true;

    /*
     * Não executa imediatamente.
     * A primeira execução acontece somente
     * após o intervalo configurado.
     */
    this.scheduleNext();

    return true;
  }

  stop(): void {
    this.started =
      false;

    if (this.timer) {
      clearTimeout(
        this.timer
      );

      this.timer =
        null;
    }
  }

  async runOnce(): Promise<{
    skipped: boolean;
    reason?: string;
    claimed?: number;
    sent?: number;
    failed?: number;
  }> {
    /*
     * Evita dois lotes simultâneos no
     * mesmo processo.
     */
    if (this.running) {
      return {
        skipped: true,
        reason:
          "already_running"
      };
    }

    this.running =
      true;

    this.lastRunStartedAt =
      new Date()
        .toISOString();

    this.lastError =
      null;

    try {
      const result =
        await this.executor
          .runBatch(
            this.batchSize
          );

      this.lastResult = {
        claimed:
          result.claimed,
        sent:
          result.sent,
        failed:
          result.failed
      };

      return {
        skipped: false,
        ...this.lastResult
      };

    } catch (error) {
      this.lastError =
        safeErrorMessage(
          error
        );

      throw error;

    } finally {
      this.running =
        false;

      this.lastRunFinishedAt =
        new Date()
          .toISOString();
    }
  }

  getStatus():
    MetaCapiWorkerStatus {
    return {
      enabled:
        this.enabled,

      started:
        this.started,

      running:
        this.running,

      interval_ms:
        this.intervalMs,

      batch_size:
        this.batchSize,

      last_run_started_at:
        this.lastRunStartedAt,

      last_run_finished_at:
        this.lastRunFinishedAt,

      last_result:
        this.lastResult,

      last_error:
        this.lastError
    };
  }

  private scheduleNext():
    void {
    if (!this.started) {
      return;
    }

    this.timer =
      setTimeout(
        async () => {
          try {
            await this.runOnce();

          } catch {
            /*
             * Falha fica registrada em
             * lastError.
             *
             * Não derrubamos o processo.
             */
          } finally {
            if (this.started) {
              this.scheduleNext();
            }
          }
        },
        this.intervalMs
      );

    /*
     * O timer não deve sozinho impedir
     * shutdown do processo Node.
     */
    this.timer.unref();
  }
}

export const metaCapiWorker =
  new MetaCapiWorker();
