import type { FastifyInstance } from "fastify";
import { requireCreativeWorker } from "./creative-worker.auth";
import { creativeWorkerController } from "./creative-worker.controller";
import type {
  ClaimCreativeJobInput,
  CompleteCreativeJobInput,
  FailCreativeJobInput
} from "./creative-worker.schemas";

interface JobParams {
  jobId: string;
}

export async function creativeWorkerRoutes(
  app: FastifyInstance
) {
  app.post<{
    Body: ClaimCreativeJobInput;
  }>(
    "/api/v1/internal/creative-jobs/claim",
    { preHandler: requireCreativeWorker },
    creativeWorkerController.claim.bind(
      creativeWorkerController
    )
  );

  app.post<{
    Params: JobParams;
    Body: CompleteCreativeJobInput;
  }>(
    "/api/v1/internal/creative-jobs/:jobId/complete",
    { preHandler: requireCreativeWorker },
    creativeWorkerController.complete.bind(
      creativeWorkerController
    )
  );

  app.post<{
    Params: JobParams;
    Body: FailCreativeJobInput;
  }>(
    "/api/v1/internal/creative-jobs/:jobId/fail",
    { preHandler: requireCreativeWorker },
    creativeWorkerController.fail.bind(
      creativeWorkerController
    )
  );
}
