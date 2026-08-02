import type {
  FastifyReply,
  FastifyRequest
} from "fastify";

import { supabase } from "../../config/supabase";

interface ResumeParams {
  customerNumber: string;
}

export class WhatsAppController {
  async resumeAutomation(
    request: FastifyRequest<{
      Params: ResumeParams;
    }>,
    reply: FastifyReply
  ) {
    const customerNumber = String(
      request.params.customerNumber ?? ""
    ).replace(/\D/g, "");

    if (customerNumber.length < 10) {
      return reply.status(400).send({
        success: false,
        error: {
          code: "INVALID_CUSTOMER_NUMBER",
          message: "O número do cliente é inválido."
        }
      });
    }

    const { data, error } = await supabase.rpc(
      "resume_whatsapp_automation",
      {
        p_customer_number: customerNumber,
        p_actor_email:
          request.adminEmail ??
          "administrador-nao-identificado"
      }
    );

    if (error) {
      request.log.error({
        error: error.message,
        customerNumber
      });

      return reply.status(500).send({
        success: false,
        error: {
          code: "RESUME_AUTOMATION_FAILED",
          message:
            "Não foi possível retomar a automação."
        }
      });
    }

    return reply.send({
      success: true,
      message:
        "Automação retomada para esta conversa.",
      data
    });
  }
}

export const whatsappController =
  new WhatsAppController();
