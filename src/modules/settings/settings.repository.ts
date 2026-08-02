import { supabase } from "../../config/supabase";
import type { UpdateSettingsInput } from "./settings.schemas";

const companyId = process.env.COMPANY_ID;

if (!companyId) {
  throw new Error("COMPANY_ID não configurada.");
}

export class SettingsRepository {
  async get() {
    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .eq("id", companyId)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async update(input: UpdateSettingsInput) {
    const current = await this.get();

    const currentSettings =
      current.settings &&
      typeof current.settings === "object"
        ? current.settings
        : {};

    const { data, error } = await supabase
      .from("companies")
      .update({
        name: input.name,
        phone: input.phone,
        whatsapp_phone: input.whatsapp_phone,
        address: input.address,
        neighborhood: input.neighborhood,
        city: input.city,
        state: input.state.toUpperCase(),
        settings: {
          ...currentSettings,
          system_name: input.system_name,
          warranty_days_default:
            input.warranty_days_default,
          low_stock_threshold_default:
            input.low_stock_threshold_default,
          advertising_reserve_percentage:
            input.advertising_reserve_percentage,
          human_handoff_enabled:
            input.human_handoff_enabled
        },
        updated_at: new Date().toISOString()
      })
      .eq("id", companyId)
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }
}

export const settingsRepository =
  new SettingsRepository();
