import type {
  FastifyReply,
  FastifyRequest
} from "fastify";

import {
  updateSettingsSchema,
  type UpdateSettingsInput
} from "./settings.schemas";

import { settingsService } from "./settings.service";

export class SettingsController {
  async get(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      const settings = await settingsService.get();

      return reply.send({
        success: true,
        data: settings
      });
    } catch (error) {
      request.log.error(error);

      return reply.status(500).send({
        success: false,
        error: {
          code: "SETTINGS_LOAD_FAILED",
          message:
            "Não foi possível carregar as configurações."
        }
      });
    }
  }

  async update(
    request: FastifyRequest<{
      Body: UpdateSettingsInput;
    }>,
    reply: FastifyReply
  ) {
    const parsed =
      updateSettingsSchema.safeParse(
        request.body
      );

    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message:
            "Os dados das configurações são inválidos.",
          details: parsed.error.flatten()
        }
      });
    }

    try {
      const settings =
        await settingsService.update(
          parsed.data
        );

      return reply.send({
        success: true,
        message:
          "Configurações atualizadas com sucesso.",
        data: settings
      });
    } catch (error) {
      request.log.error(error);

      return reply.status(500).send({
        success: false,
        error: {
          code: "SETTINGS_UPDATE_FAILED",
          message:
            "Não foi possível salvar as configurações."
        }
      });
    }
  }
}

export const settingsController =
  new SettingsController();
