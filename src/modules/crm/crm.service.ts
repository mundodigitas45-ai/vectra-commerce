import { crmRepository } from "./crm.repository";

import type {
  CreateCrmActivityInput,
  CreateCrmContactInput,
  CreateCrmOpportunityInput,
  CrmBoardQuery,
  CrmContactsQuery,
  MoveCrmOpportunityInput,
  UpdateCrmOpportunityInput
} from "./crm.schemas";

type CodedError = Error & {
  code?: string;
};

function codedError(
  code: string,
  message: string
) {
  const error =
    new Error(message) as CodedError;

  error.code = code;

  return error;
}

function normalizeIdentifier(
  channel: CreateCrmContactInput["channel"],
  value: string
) {
  const trimmed = value.trim();

  if (
    channel === "whatsapp" ||
    channel === "phone"
  ) {
    const digits = trimmed.replace(
      /\D+/g,
      ""
    );

    if (digits.length < 10) {
      throw codedError(
        "CRM_INVALID_CHANNEL_IDENTIFIER",
        "O número informado é inválido."
      );
    }

    return digits;
  }

  if (channel === "email") {
    return trimmed.toLowerCase();
  }

  return trimmed;
}

export class CrmService {
  async getBoard(
    companyId: string,
    input: CrmBoardQuery
  ) {
    const pipeline = input.pipeline_id
      ? await crmRepository.getPipeline(
          companyId,
          input.pipeline_id
        )
      : await crmRepository
          .getDefaultPipeline(companyId);

    const [
      stages,
      opportunities
    ] = await Promise.all([
      crmRepository.listStages(
        companyId,
        pipeline.id
      ),
      crmRepository.listOpportunities(
        companyId,
        pipeline.id,
        input.status
      )
    ]);

    const contactIds = [
      ...new Set(
        opportunities
          .map(
            (opportunity) =>
              String(
                opportunity.contact_id ??
                ""
              )
          )
          .filter(Boolean)
      )
    ];

    const contacts =
      await crmRepository
        .listContactsByIds(
          companyId,
          contactIds
        );

    const contactsById =
      new Map(
        contacts.map(
          (contact) => [
            contact.id,
            contact
          ]
        )
      );

    const opportunitiesWithContact =
      opportunities.map(
        (opportunity) => ({
          ...opportunity,
          contact:
            contactsById.get(
              opportunity.contact_id
            ) ?? null
        })
      );

    return {
      pipeline,
      stages: stages.map(
        (stage) => ({
          ...stage,
          opportunities:
            opportunitiesWithContact
              .filter(
                (opportunity) =>
                  opportunity.stage_id ===
                  stage.id
              )
        })
      ),
      totals: {
        stages: stages.length,
        opportunities:
          opportunities.length
      }
    };
  }

  async listContacts(
    companyId: string,
    input: CrmContactsQuery
  ) {
    return crmRepository.listContacts(
      companyId,
      input
    );
  }

  async getContactDetail(
    companyId: string,
    contactId: string
  ) {
    return crmRepository.getContactDetail(
      companyId,
      contactId
    );
  }

  async upsertContact(
    companyId: string,
    userId: string,
    input: CreateCrmContactInput
  ) {
    return crmRepository.upsertContact(
      companyId,
      userId,
      {
        ...input,
        channel_identifier:
          normalizeIdentifier(
            input.channel,
            input.channel_identifier
          )
      }
    );
  }

  async createOpportunity(
    companyId: string,
    userId: string,
    input: CreateCrmOpportunityInput
  ) {
    const contact =
      await crmRepository.getContact(
        companyId,
        input.contact_id
      );

    const pipeline = input.pipeline_id
      ? await crmRepository.getPipeline(
          companyId,
          input.pipeline_id
        )
      : await crmRepository
          .getDefaultPipeline(companyId);

    const stage = input.stage_id
      ? await crmRepository.getStage(
          companyId,
          pipeline.id,
          input.stage_id
        )
      : await crmRepository.getStageByCode(
          companyId,
          pipeline.id,
          "new_contact"
        );

    return crmRepository.createOpportunity(
      companyId,
      userId,
      pipeline.id,
      stage.id,
      {
        ...input,
        customer_id:
          input.customer_id ??
          contact.customer_id ??
          null,
        store_id:
          input.store_id ??
          contact.store_id ??
          null
      }
    );
  }

  async updateOpportunity(
    companyId: string,
    opportunityId: string,
    input: UpdateCrmOpportunityInput
  ) {
    await crmRepository.getOpportunity(
      companyId,
      opportunityId
    );

    return crmRepository.updateOpportunity(
      companyId,
      opportunityId,
      input
    );
  }

  async moveOpportunity(
    companyId: string,
    opportunityId: string,
    input: MoveCrmOpportunityInput
  ) {
    const opportunity =
      await crmRepository.getOpportunity(
        companyId,
        opportunityId
      );

    const stage =
      await crmRepository.getStage(
        companyId,
        opportunity.pipeline_id,
        input.stage_id
      );

    const now =
      new Date().toISOString();

    const patch: Record<
      string,
      unknown
    > = {
      stage_id: stage.id,
      status: "open",
      won_at: null,
      lost_at: null,
      lost_reason: null,
      last_activity_at: now
    };

    if (stage.stage_type === "won") {
      patch.status = "won";
      patch.won_at = now;
    }

    if (stage.stage_type === "lost") {
      if (!input.lost_reason) {
        throw codedError(
          "CRM_LOST_REASON_REQUIRED",
          "Informe o motivo da perda da oportunidade."
        );
      }

      patch.status = "lost";
      patch.lost_at = now;
      patch.lost_reason =
        input.lost_reason;
    }

    const moved =
      await crmRepository.moveOpportunity(
        companyId,
        opportunityId,
        patch
      );

    await crmRepository.createActivity(
      companyId,
      opportunity.created_by,
      opportunityId,
      opportunity.contact_id,
      {
        activity_type:
          "stage_changed",
        direction:
          "internal",
        title:
          "Etapa atualizada",
        description:
          `Oportunidade movida para ${stage.name}.`,
        customer_id:
          opportunity.customer_id,
        order_id:
          opportunity.order_id,
        metadata: {
          previous_stage_id:
            opportunity.stage_id,
          stage_id:
            stage.id,
          stage_code:
            stage.code
        }
      }
    );

    return moved;
  }

  async createActivity(
    companyId: string,
    userId: string,
    opportunityId: string,
    input: CreateCrmActivityInput
  ) {
    const opportunity =
      await crmRepository.getOpportunity(
        companyId,
        opportunityId
      );

    return crmRepository.createActivity(
      companyId,
      userId,
      opportunityId,
      opportunity.contact_id,
      {
        ...input,
        customer_id:
          input.customer_id ??
          opportunity.customer_id ??
          null,
        order_id:
          input.order_id ??
          opportunity.order_id ??
          null
      }
    );
  }
}

export const crmService =
  new CrmService();
