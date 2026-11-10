import type { FastifyInstance } from "fastify";
import { requireCreativeWorker } from "../creative-workers/creative-worker.auth";
import { requireCompanyAccess } from "../auth/company-context.auth";
import {
  previewProfessionalRealPhoto,
  type PreviewInput
} from "./professional-real-photo-preview";
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
  app.post<{ Body: PreviewInput }>(
    "/api/v1/creative-image-preview/real-photo",
    { preHandler: requireCompanyAccess, bodyLimit: 8 * 1024 },
    previewProfessionalRealPhoto
  );

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

