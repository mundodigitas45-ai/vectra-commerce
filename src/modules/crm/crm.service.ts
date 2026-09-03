import { crmRepository } from "./crm.repository";

import type {
  CreateCrmActivityInput,
  CreateCrmContactInput,
  CreateCrmOpportunityInput,
  CrmBoardQuery,
  CrmContactsQuery,
  CrmInternalEventInput,
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
    userId: string | null,
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
    userId: string | null,
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
    userId: string | null,
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

  async processInternalEvent(
    input: CrmInternalEventInput
  ) {
    const customerNumber =
      normalizeIdentifier(
        "whatsapp",
        input.customer_number
      );

    const contact =
      await this.upsertContact(
        input.company_id,
        null,
        {
          customer_id:
            input.customer_id,
          store_id:
            input.store_id,
          channel:
            "whatsapp",
          channel_identifier:
            customerNumber,
          whatsapp_instance_name:
            input.instance_name,
          name:
            input.customer_name,
          phone:
            customerNumber,
          source:
            "whatsapp_automation",
          metadata: {
            last_event:
              input.event_type,
            ...input.metadata
          }
        }
      );

    let opportunity =
      input.order_id
        ? await crmRepository
            .findOpportunityByOrder(
              input.company_id,
              input.order_id
            )
        : null;

    if (!opportunity) {
      opportunity =
        await crmRepository
          .findOpenOpportunity(
            input.company_id,
            contact.id
          );
    }

    if (!opportunity) {
      opportunity =
        await this.createOpportunity(
          input.company_id,
          null,
          {
            contact_id:
              contact.id,
            customer_id:
              input.customer_id ??
              contact.customer_id ??
              null,
            store_id:
              input.store_id ??
              contact.store_id ??
              null,
            order_id:
              input.order_id ?? null,
            title:
              input.customer_name
                ? `Atendimento de ${input.customer_name}`
                : `Atendimento ${customerNumber.slice(-4)}`,
            priority:
              "normal",
            estimated_value:
              input.estimated_value ??
              null,
            currency:
              "BRL",
            product_context:
              input.product_context,
            device_context:
              input.device_context,
            metadata: {
              source:
                "whatsapp_automation",
              instance_name:
                input.instance_name
            }
          }
        );
    }

    const update:
      Record<string, unknown> = {};

    if (
      input.customer_id !== undefined
    ) {
      update.customer_id =
        input.customer_id;
    }

    if (
      input.store_id !== undefined
    ) {
      update.store_id =
        input.store_id;
    }

    if (
      input.order_id !== undefined
    ) {
      update.order_id =
        input.order_id;
    }

    if (
      input.estimated_value !== undefined
    ) {
      update.estimated_value =
        input.estimated_value;
    }

    if (
      Object.keys(
        input.product_context
      ).length > 0
    ) {
      update.product_context =
        input.product_context;
    }

    if (
      Object.keys(
        input.device_context
      ).length > 0
    ) {
      update.device_context =
        input.device_context;
    }

    if (Object.keys(update).length > 0) {
      opportunity =
        await crmRepository
          .updateOpportunity(
            input.company_id,
            opportunity.id,
            update
          );
    }

    const stageByEvent:
      Partial<
        Record<
          CrmInternalEventInput[
            "event_type"
          ],
          string
        >
      > = {
        conversation_started:
          "new_contact",
        message_received:
          "in_service",
        product_identified:
          "product_identified",
        compatibility_confirmed:
          "compatibility_confirmed",
        awaiting_address:
          "awaiting_address",
        address_received:
          "awaiting_confirmation",
        awaiting_confirmation:
          "awaiting_confirmation",
        order_created:
          "order_created",
        order_confirmed:
          "won",
        order_cancelled:
          "lost",
        order_delivered:
          "post_sale",
        human_takeover:
          "in_service"
      };

    const stageCode =
      stageByEvent[input.event_type];

    if (stageCode) {
      const stage =
        await crmRepository
          .getStageByCode(
            input.company_id,
            opportunity.pipeline_id,
            stageCode
          );

      const shouldMove =
        opportunity.stage_id !==
          stage.id ||
        (
          stage.stage_type === "won" &&
          opportunity.status !== "won"
        ) ||
        (
          stage.stage_type === "lost" &&
          opportunity.status !== "lost"
        );

      if (shouldMove) {
        opportunity =
          await this.moveOpportunity(
            input.company_id,
            opportunity.id,
            {
              stage_id:
                stage.id,
              lost_reason:
                input.event_type ===
                "order_cancelled"
                  ? "Pedido cancelado"
                  : undefined
            }
          );
      }
    }

    try {
      await crmRepository.createActivity(
        input.company_id,
        null,
        opportunity.id,
        contact.id,
        {
          activity_type:
            input.event_type,
          direction:
            input.event_type ===
              "human_takeover"
              ? "internal"
              : "inbound",
          title:
            input.event_type
              .replace(/_/g, " "),
          external_id:
            input.external_id ??
            null,
          customer_id:
            input.customer_id ??
            opportunity.customer_id ??
            null,
          order_id:
            input.order_id ??
            opportunity.order_id ??
            null,
          occurred_at:
            input.occurred_at,
          metadata:
            input.metadata
        }
      );
    } catch (error: unknown) {
      const code =
        (error as CodedError)?.code;

      if (
        code !==
        "CRM_ACTIVITY_ALREADY_EXISTS"
      ) {
        throw error;
      }
    }

    return {
      contact,
      opportunity,
      event_type:
        input.event_type
    };
  }
}

export const crmService =
  new CrmService();
