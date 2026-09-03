import { supabase } from "../../config/supabase";

import type {
  CreateCrmActivityInput,
  CreateCrmContactInput,
  CreateCrmOpportunityInput,
  CrmBoardQuery,
  CrmContactsQuery,
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

function databaseError(
  error: {
    message?: string;
    code?: string;
  }
) {
  const wrapped =
    new Error(
      error.message ??
      "Falha de banco de dados."
    ) as CodedError;

  wrapped.code =
    error.code ??
    "CRM_DATABASE_ERROR";

  return wrapped;
}

export class CrmRepository {
  async getDefaultPipeline(
    companyId: string
  ) {
    const { data, error } = await supabase
      .from("crm_pipelines")
      .select("*")
      .eq("company_id", companyId)
      .eq("is_default", true)
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      throw databaseError(error);
    }

    if (!data) {
      throw codedError(
        "CRM_PIPELINE_NOT_FOUND",
        "O funil comercial da empresa não foi encontrado."
      );
    }

    return data;
  }

  async getPipeline(
    companyId: string,
    pipelineId: string
  ) {
    const { data, error } = await supabase
      .from("crm_pipelines")
      .select("*")
      .eq("company_id", companyId)
      .eq("id", pipelineId)
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      throw databaseError(error);
    }

    if (!data) {
      throw codedError(
        "CRM_PIPELINE_NOT_FOUND",
        "Funil comercial não encontrado."
      );
    }

    return data;
  }

  async getStage(
    companyId: string,
    pipelineId: string,
    stageId: string
  ) {
    const { data, error } = await supabase
      .from("crm_stages")
      .select("*")
      .eq("company_id", companyId)
      .eq("pipeline_id", pipelineId)
      .eq("id", stageId)
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      throw databaseError(error);
    }

    if (!data) {
      throw codedError(
        "CRM_STAGE_NOT_FOUND",
        "Etapa do funil não encontrada."
      );
    }

    return data;
  }

  async getStageByCode(
    companyId: string,
    pipelineId: string,
    code: string
  ) {
    const { data, error } = await supabase
      .from("crm_stages")
      .select("*")
      .eq("company_id", companyId)
      .eq("pipeline_id", pipelineId)
      .eq("code", code)
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      throw databaseError(error);
    }

    if (!data) {
      throw codedError(
        "CRM_STAGE_NOT_FOUND",
        "Etapa do funil não encontrada."
      );
    }

    return data;
  }

  async listStages(
    companyId: string,
    pipelineId: string
  ) {
    const { data, error } = await supabase
      .from("crm_stages")
      .select("*")
      .eq("company_id", companyId)
      .eq("pipeline_id", pipelineId)
      .eq("is_active", true)
      .order("position", {
        ascending: true
      });

    if (error) {
      throw databaseError(error);
    }

    return data ?? [];
  }

  async listOpportunities(
    companyId: string,
    pipelineId: string,
    status: CrmBoardQuery["status"]
  ) {
    let query = supabase
      .from("crm_opportunities")
      .select("*")
      .eq("company_id", companyId)
      .eq("pipeline_id", pipelineId)
      .order("updated_at", {
        ascending: false
      })
      .limit(500);

    if (status) {
      query = query.eq(
        "status",
        status
      );
    }

    const { data, error } = await query;

    if (error) {
      throw databaseError(error);
    }

    return data ?? [];
  }

  async listContactsByIds(
    companyId: string,
    contactIds: string[]
  ) {
    if (contactIds.length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from("crm_contacts")
      .select("*")
      .eq("company_id", companyId)
      .in("id", contactIds);

    if (error) {
      throw databaseError(error);
    }

    return data ?? [];
  }

  async listContacts(
    companyId: string,
    input: CrmContactsQuery
  ) {
    let query = supabase
      .from("crm_contacts")
      .select("*")
      .eq("company_id", companyId)
      .order("last_interaction_at", {
        ascending: false,
        nullsFirst: false
      })
      .limit(input.limit);

    if (input.status) {
      query = query.eq(
        "status",
        input.status
      );
    }

    if (input.search) {
      const search = input.search
        .replace(/[,%()]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      if (search) {
        query = query.or(
          `name.ilike.%${search}%,phone.ilike.%${search}%,channel_identifier.ilike.%${search}%`
        );
      }
    }

    const { data, error } = await query;

    if (error) {
      throw databaseError(error);
    }

    return data ?? [];
  }

  async getContact(
    companyId: string,
    contactId: string
  ) {
    const { data, error } = await supabase
      .from("crm_contacts")
      .select("*")
      .eq("company_id", companyId)
      .eq("id", contactId)
      .maybeSingle();

    if (error) {
      throw databaseError(error);
    }

    if (!data) {
      throw codedError(
        "CRM_CONTACT_NOT_FOUND",
        "Contato não encontrado."
      );
    }

    return data;
  }

  async upsertContact(
    companyId: string,
    userId: string,
    input: CreateCrmContactInput
  ) {
    const now =
      new Date().toISOString();

    const { data, error } = await supabase
      .from("crm_contacts")
      .upsert(
        {
          company_id: companyId,
          customer_id:
            input.customer_id ?? null,
          store_id:
            input.store_id ?? null,
          channel: input.channel,
          channel_identifier:
            input.channel_identifier,
          whatsapp_instance_name:
            input.whatsapp_instance_name ??
            null,
          name:
            input.name ?? null,
          phone:
            input.phone ?? null,
          email:
            input.email ?? null,
          source: input.source,
          status: "active",
          last_interaction_at: now,
          metadata: input.metadata,
          created_by: userId
        },
        {
          onConflict:
            "company_id,channel,channel_identifier"
        }
      )
      .select("*")
      .single();

    if (error) {
      throw databaseError(error);
    }

    return data;
  }

  async getContactDetail(
    companyId: string,
    contactId: string
  ) {
    const contact =
      await this.getContact(
        companyId,
        contactId
      );

    const [
      opportunityResult,
      activityResult
    ] = await Promise.all([
      supabase
        .from("crm_opportunities")
        .select("*")
        .eq("company_id", companyId)
        .eq("contact_id", contactId)
        .order("updated_at", {
          ascending: false
        }),
      supabase
        .from("crm_activities")
        .select("*")
        .eq("company_id", companyId)
        .eq("contact_id", contactId)
        .order("occurred_at", {
          ascending: false
        })
        .limit(200)
    ]);

    if (opportunityResult.error) {
      throw databaseError(
        opportunityResult.error
      );
    }

    if (activityResult.error) {
      throw databaseError(
        activityResult.error
      );
    }

    return {
      contact,
      opportunities:
        opportunityResult.data ?? [],
      activities:
        activityResult.data ?? []
    };
  }

  async getOpportunity(
    companyId: string,
    opportunityId: string
  ) {
    const { data, error } = await supabase
      .from("crm_opportunities")
      .select("*")
      .eq("company_id", companyId)
      .eq("id", opportunityId)
      .maybeSingle();

    if (error) {
      throw databaseError(error);
    }

    if (!data) {
      throw codedError(
        "CRM_OPPORTUNITY_NOT_FOUND",
        "Oportunidade não encontrada."
      );
    }

    return data;
  }

  async createOpportunity(
    companyId: string,
    userId: string,
    pipelineId: string,
    stageId: string,
    input: CreateCrmOpportunityInput
  ) {
    const { data, error } = await supabase
      .from("crm_opportunities")
      .insert({
        company_id: companyId,
        pipeline_id: pipelineId,
        stage_id: stageId,
        contact_id: input.contact_id,
        customer_id:
          input.customer_id ?? null,
        store_id:
          input.store_id ?? null,
        order_id:
          input.order_id ?? null,
        assigned_user_id:
          input.assigned_user_id ?? null,
        title: input.title,
        status: "open",
        priority: input.priority,
        estimated_value:
          input.estimated_value ?? null,
        currency:
          input.currency.toUpperCase(),
        product_context:
          input.product_context,
        device_context:
          input.device_context,
        next_action_at:
          input.next_action_at ?? null,
        last_activity_at:
          new Date().toISOString(),
        metadata: input.metadata,
        created_by: userId
      })
      .select("*")
      .single();

    if (error) {
      throw databaseError(error);
    }

    return data;
  }

  async updateOpportunity(
    companyId: string,
    opportunityId: string,
    input: UpdateCrmOpportunityInput
  ) {
    const patch: Record<
      string,
      unknown
    > = {
      ...input
    };

    const { data, error } = await supabase
      .from("crm_opportunities")
      .update(patch)
      .eq("company_id", companyId)
      .eq("id", opportunityId)
      .select("*")
      .maybeSingle();

    if (error) {
      throw databaseError(error);
    }

    if (!data) {
      throw codedError(
        "CRM_OPPORTUNITY_NOT_FOUND",
        "Oportunidade não encontrada."
      );
    }

    return data;
  }

  async moveOpportunity(
    companyId: string,
    opportunityId: string,
    patch: Record<string, unknown>
  ) {
    const { data, error } = await supabase
      .from("crm_opportunities")
      .update(patch)
      .eq("company_id", companyId)
      .eq("id", opportunityId)
      .select("*")
      .maybeSingle();

    if (error) {
      throw databaseError(error);
    }

    if (!data) {
      throw codedError(
        "CRM_OPPORTUNITY_NOT_FOUND",
        "Oportunidade não encontrada."
      );
    }

    return data;
  }

  async createActivity(
    companyId: string,
    userId: string,
    opportunityId: string,
    contactId: string,
    input: CreateCrmActivityInput
  ) {
    const occurredAt =
      input.occurred_at ??
      new Date().toISOString();

    const { data, error } = await supabase
      .from("crm_activities")
      .insert({
        company_id: companyId,
        opportunity_id:
          opportunityId,
        contact_id: contactId,
        customer_id:
          input.customer_id ?? null,
        order_id:
          input.order_id ?? null,
        activity_type:
          input.activity_type,
        direction:
          input.direction ?? null,
        title:
          input.title ?? null,
        description:
          input.description ?? null,
        external_id:
          input.external_id ?? null,
        occurred_at:
          occurredAt,
        metadata:
          input.metadata,
        created_by:
          userId
      })
      .select("*")
      .single();

    if (error) {
      if (error.code === "23505") {
        throw codedError(
          "CRM_ACTIVITY_ALREADY_EXISTS",
          "Esta atividade já foi registrada."
        );
      }

      throw databaseError(error);
    }

    const {
      error: updateError
    } = await supabase
      .from("crm_opportunities")
      .update({
        last_activity_at:
          occurredAt
      })
      .eq("company_id", companyId)
      .eq("id", opportunityId);

    if (updateError) {
      throw databaseError(
        updateError
      );
    }

    return data;
  }
}

export const crmRepository =
  new CrmRepository();
