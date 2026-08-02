import type { UpdateSettingsInput } from "./settings.schemas";
import { settingsRepository } from "./settings.repository";

export class SettingsService {
  async get() {
    const company = await settingsRepository.get();

    const settings =
      company.settings &&
      typeof company.settings === "object"
        ? company.settings
        : {};

    return {
      id: company.id,
      name: company.name,
      system_name:
        settings.system_name ?? "Vectra Commerce",
      phone: company.phone ?? "",
      whatsapp_phone:
        company.whatsapp_phone ?? company.phone ?? "",
      address: company.address ?? "",
      neighborhood: company.neighborhood ?? "",
      city: company.city ?? "Belém",
      state: company.state ?? "PA",
      warranty_days_default:
        settings.warranty_days_default ?? 30,
      low_stock_threshold_default:
        settings.low_stock_threshold_default ?? 3,
      advertising_reserve_percentage:
        settings.advertising_reserve_percentage ?? 10,
      human_handoff_enabled:
        settings.human_handoff_enabled ?? true
    };
  }

  async update(input: UpdateSettingsInput) {
    await settingsRepository.update(input);
    return this.get();
  }
}

export const settingsService =
  new SettingsService();
