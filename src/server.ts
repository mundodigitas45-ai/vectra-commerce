import "dotenv/config";

import {
  buildApp
} from "./app";

import {
  metaCapiWorker
} from "./modules/meta-capi/meta-capi.worker";

const port =
  Number(
    process.env.PORT ??
    3000
  );

const host =
  process.env.HOST ??
  "0.0.0.0";

async function start():
  Promise<void> {
  const app =
    await buildApp();

  let shuttingDown =
    false;

  const shutdown =
    async (
      signal:
        "SIGTERM" |
        "SIGINT"
    ): Promise<void> => {
      if (shuttingDown) {
        return;
      }

      shuttingDown =
        true;

      app.log.info({
        message:
          "Encerrando Vectra Commerce API",
        signal
      });

      metaCapiWorker.stop();

      try {
        await app.close();

        app.log.info({
          message:
            "Vectra Commerce API encerrada",
          signal
        });

      } catch (error) {
        app.log.error({
          message:
            "Erro ao encerrar Vectra Commerce API",
          signal,
          error
        });

        process.exitCode =
          1;
      }
    };

  process.once(
    "SIGTERM",
    () => {
      void shutdown(
        "SIGTERM"
      );
    }
  );

  process.once(
    "SIGINT",
    () => {
      void shutdown(
        "SIGINT"
      );
    }
  );

  try {
    await app.listen({
      port,
      host
    });

    app.log.info({
      message:
        "Vectra Commerce API iniciada",
      host,
      port
    });

    const workerStarted =
      metaCapiWorker.start();

    const workerStatus =
      metaCapiWorker
        .getStatus();

    app.log.info({
      message:
        "Meta CAPI worker configurado",
      enabled:
        workerStatus.enabled,
      started:
        workerStarted,
      interval_ms:
        workerStatus.interval_ms,
      batch_size:
        workerStatus.batch_size
    });

  } catch (error) {
    metaCapiWorker.stop();

    app.log.error(error);

    process.exit(1);
  }
}

void start();
