import type { FastifyInstance } from "fastify";

import { requireUserAuth } from "../auth/user-context.auth";
import { onboardingController } from "./onboarding.controller";
import type {
  CreateOnboardingSessionInput,
  UpdateOnboardingSessionInput
} from "./onboarding.schemas";

export async function onboardingRoutes(
  app: FastifyInstance
) {
  const protectedRoute = {
    preHandler: requireUserAuth
  };

  app.get(
    "/api/v1/onboarding/session",
    protectedRoute,
    onboardingController.getCurrent.bind(
      onboardingController
    )
  );

  app.post<{
    Body: CreateOnboardingSessionInput;
  }>(
    "/api/v1/onboarding/session",
    protectedRoute,
    onboardingController.create.bind(
      onboardingController
    )
  );

  app.patch<{
    Body: UpdateOnboardingSessionInput;
  }>(
    "/api/v1/onboarding/session",
    protectedRoute,
    onboardingController.update.bind(
      onboardingController
    )
  );
}
