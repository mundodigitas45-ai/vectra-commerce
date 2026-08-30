import type {
  CreateOnboardingSessionInput,
  UpdateOnboardingSessionInput
} from "./onboarding.schemas";

import { onboardingRepository } from "./onboarding.repository";

export class OnboardingServiceError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = "OnboardingServiceError";
  }
}

type SessionRow = Record<string, any>;

function publicSession(session: SessionRow) {
  const plan = Array.isArray(session.plan)
    ? session.plan[0] ?? null
    : session.plan ?? null;

  return {
    id: session.id,
    status: session.status,
    company_name: session.company_name,
    contact_name: session.contact_name,
    contact_email: session.contact_email,
    contact_phone: session.contact_phone,
    document: session.document,
    expires_at: session.expires_at,
    completed_at: session.completed_at,
    plan: plan
      ? {
          id: plan.id,
          code: plan.code,
          name: plan.name,
          billing_interval:
            plan.billing_interval,
          price_amount:
            plan.price_amount == null
              ? null
              : Number(plan.price_amount),
          currency: plan.currency?.trim(),
          trial_days: plan.trial_days
        }
      : null,
    created_at: session.created_at,
    updated_at: session.updated_at
  };
}

export class OnboardingService {
  async getCurrent(userId: string) {
    const session =
      await onboardingRepository.findCurrent(
        userId
      );

    return session
      ? publicSession(session)
      : null;
  }

  async create(
    userId: string,
    email: string | null,
    input: CreateOnboardingSessionInput
  ) {
    const existing =
      await onboardingRepository.findCurrent(
        userId
      );

    if (existing) {
      return publicSession(existing);
    }

    const hasCompany =
      await onboardingRepository.hasCompanyAccess(
        userId
      );

    if (hasCompany) {
      throw new OnboardingServiceError(
        "COMPANY_ALREADY_EXISTS",
        "Este usuário já possui acesso a uma empresa.",
        409
      );
    }

    const plan = input.plan_code
      ? await onboardingRepository.findPublicPlan(
          input.plan_code
        )
      : null;

    if (input.plan_code && !plan) {
      throw new OnboardingServiceError(
        "PLAN_NOT_AVAILABLE",
        "O plano informado não está disponível.",
        404
      );
    }

    const expiresAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    ).toISOString();

    const session =
      await onboardingRepository.create({
        userId,
        email,
        planId: plan?.id ?? null,
        status: plan
          ? "plan_selected"
          : "started",
        expiresAt
      });

    if (!session) {
      throw new Error(
        "A sessão de onboarding não foi criada."
      );
    }

    return publicSession(session);
  }

  async update(
    userId: string,
    input: UpdateOnboardingSessionInput
  ) {
    const session =
      await onboardingRepository.findCurrent(
        userId
      );

    if (!session) {
      throw new OnboardingServiceError(
        "ONBOARDING_NOT_FOUND",
        "Nenhum cadastro em andamento foi encontrado.",
        404
      );
    }

    const values: Record<string, unknown> = {};

    if (input.company_name !== undefined) {
      values.company_name =
        input.company_name.trim();
    }

    if (input.contact_name !== undefined) {
      values.contact_name =
        input.contact_name.trim();
    }

    if (input.contact_phone !== undefined) {
      values.contact_phone =
        input.contact_phone.trim();
    }

    if (input.document !== undefined) {
      values.document =
        input.document?.trim() || null;
    }

    if (input.plan_code !== undefined) {
      const plan =
        await onboardingRepository.findPublicPlan(
          input.plan_code
        );

      if (!plan) {
        throw new OnboardingServiceError(
          "PLAN_NOT_AVAILABLE",
          "O plano informado não está disponível.",
          404
        );
      }

      values.plan_id = plan.id;

      if (
        ["started", "email_pending", "plan_selected"]
          .includes(session.status)
      ) {
        values.status = "plan_selected";
      }
    }

    const updated =
      await onboardingRepository.update(
        session.id,
        values
      );

    return publicSession(updated);
  }
}

export const onboardingService =
  new OnboardingService();
