import type { FastifyReply, FastifyRequest } from "fastify";

import { supabase } from "../../config/supabase";

interface SessionParams {
  customerNumber: string;
}

interface PauseBody {
  reason?: string;
  actor_type?: string;
  actor_user_id?: string | null;
  source?: string;
}

function normalizeCustomerNumber(value: unknown): string {
  return String(value ?? "").replace(/\D/g, "");
}

function isValidCustomerNumber(value: string): boolean {
  return value.length >= 10 && value.length <= 15;
}

export class WhatsAppController {
  async pauseAutomation(
    request: FastifyRequest<{
      Params: SessionParams;
      Body: PauseBody;
    }>,
    reply: FastifyReply,
  ) {
    const customerNumber = normalizeCustomerNumber(
      request.params.customerNumber,
    );

    if (!isValidCustomerNumber(customerNumber)) {
      return reply.status(400).send({
        success: false,
        error: {
          code: "INVALID_CUSTOMER_NUMBER",
          message: "O número do cliente é inválido.",
        },
      });
    }

    const body = request.body ?? {};

    if (body.actor_type !== "human_agent") {
      return reply.status(400).send({
        success: false,
        error: {
          code: "HUMAN_ACTOR_REQUIRED",
          message: "A pausa exige um atendente humano autenticado.",
        },
      });
    }

    const actorUserId = String(body.actor_user_id ?? "").trim();

    const validActorUserId =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        actorUserId,
      );

    if (!validActorUserId) {
      return reply.status(400).send({
        success: false,
        error: {
          code: "USER_ID_REQUIRED",
          message: "O usuário responsável pela pausa não foi identificado.",
        },
      });
    }

    const allowedReasons = new Set([
      "manual_button",
      "takeover_button",
      "supervisor_action",
    ]);

    const reason = String(body.reason ?? "takeover_button").trim();

    if (!allowedReasons.has(reason)) {
      return reply.status(400).send({
        success: false,
        error: {
          code: "INVALID_PAUSE_REASON",
          message: "O motivo informado não pode pausar a automação.",
        },
      });
    }

    const now = new Date().toISOString();

    const actor = request.adminEmail ?? actorUserId;

    const { data, error } = await supabase
      .from("whatsapp_order_sessions")
      .update({
        human_takeover: true,
        human_takeover_at: now,
        human_takeover_by: actor,
        automation_paused_until: null,
        updated_at: now,
      })
      .eq("customer_number", customerNumber)
      .select(
        "id,customer_number,human_takeover,human_takeover_at,human_takeover_by,automation_paused_until",
      )
      .maybeSingle();

    if (error) {
      request.log.error({
        error: error.message,
        customerNumber,
        action: "pause_whatsapp_automation",
      });

      return reply.status(500).send({
        success: false,
        error: {
          code: "DATABASE_ERROR",
          message: "Não foi possível pausar a automação.",
        },
      });
    }

    if (!data) {
      return reply.status(404).send({
        success: false,
        error: {
          code: "SESSION_NOT_FOUND",
          message: "Sessão do WhatsApp não encontrada.",
        },
      });
    }

    return reply.send({
      success: true,
      message: "Atendimento humano assumido.",
      data: {
        ...data,
        automation_paused: true,
        automation_status: "paused_by_human",
        pause_reason: reason,
        paused_source: body.source ?? "whatsapp_panel",
        paused_by_user_id: actorUserId,
      },
    });
  }

  async resumeAutomation(
    request: FastifyRequest<{
      Params: SessionParams;
    }>,
    reply: FastifyReply,
  ) {
    const customerNumber = normalizeCustomerNumber(
      request.params.customerNumber,
    );

    if (!isValidCustomerNumber(customerNumber)) {
      return reply.status(400).send({
        success: false,
        error: {
          code: "INVALID_CUSTOMER_NUMBER",
          message: "O número do cliente é inválido.",
        },
      });
    }

    const { data, error } = await supabase.rpc("resume_whatsapp_automation", {
      p_customer_number: customerNumber,
      p_actor_email: request.adminEmail ?? "administrador-nao-identificado",
    });

    if (error) {
      request.log.error({
        error: error.message,
        customerNumber,
        action: "resume_whatsapp_automation",
      });

      return reply.status(500).send({
        success: false,
        error: {
          code: "RESUME_AUTOMATION_FAILED",
          message: "Não foi possível retomar a automação.",
        },
      });
    }

    return reply.send({
      success: true,
      message: "Automação retomada para esta conversa.",
      data,
    });
  }
}

export const whatsappController = new WhatsAppController();
