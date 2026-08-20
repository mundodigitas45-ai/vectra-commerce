import type { FastifyInstance } from "fastify";
import { requireCreativeWorker } from "../creative-workers/creative-worker.auth";
import { creativeImageWorkerController } from "./creative-image-worker.controller";
import type {
  ClaimCreativeImageJobInput,
  CompleteCreativeImageJobInput,
  FailCreativeImageJobInput
} from "./creative-image-worker.schemas";

interface JobParams {
  jobId: string;
}

export async function creativeImageWorkerRoutes(
  app: FastifyInstance
) {
  app.post<{
    Body: ClaimCreativeImageJobInput;
  }>(
    "/api/v1/internal/creative-image-jobs/claim",
    { preHandler: requireCreativeWorker },
    creativeImageWorkerController.claim.bind(
      creativeImageWorkerController
    )
  );

  app.post<{
    Params: JobParams;
    Body: CompleteCreativeImageJobInput;
  }>(
    "/api/v1/internal/creative-image-jobs/:jobId/complete",
    {
      preHandler: requireCreativeWorker,
      bodyLimit: 32 * 1024 * 1024
    },
    creativeImageWorkerController.complete.bind(
      creativeImageWorkerController
    )
  );

  app.post<{
    Params: JobParams;
    Body: FailCreativeImageJobInput;
  }>(
    "/api/v1/internal/creative-image-jobs/:jobId/fail",
    { preHandler: requireCreativeWorker },
    creativeImageWorkerController.fail.bind(
      creativeImageWorkerController
    )
  );
}
