import "dotenv/config";
import { buildApp } from "./app";

const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? "0.0.0.0";

async function start(): Promise<void> {
  const app = buildApp();

  try {
    await app.listen({
      port,
      host
    });

    app.log.info({
      message: "Vectra Commerce API iniciada",
      host,
      port
    });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

void start();
