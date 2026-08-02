import { supabase } from "../../config/supabase";

import type {
  CreateDeliveryZoneInput,
  UpdateDeliveryZoneInput
} from "./delivery-zone.schemas";

function requiredEnvironment(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name}_NOT_CONFIGURED`);
  }

  return value;
}

export class DeliveryZoneRepository {
  private get companyId(): string {
    return requiredEnvironment("COMPANY_ID");
  }

  async list() {
    const { data, error } = await supabase
      .from("delivery_zones")
      .select(`
        id,
        company_id,
        neighborhood,
        normalized_neighborhood,
        delivery_fee,
        estimated_delivery_cost,
        is_active,
        created_at,
        updated_at
      `)
      .eq("company_id", this.companyId)
      .order("neighborhood", {
        ascending: true
      });

    if (error) {
      throw new Error(error.message);
    }

    return data ?? [];
  }

  async findById(zoneId: string) {
    const { data, error } = await supabase
      .from("delivery_zones")
      .select(`
        id,
        company_id,
        neighborhood,
        normalized_neighborhood,
        delivery_fee,
        estimated_delivery_cost,
        is_active,
        created_at,
        updated_at
      `)
      .eq("company_id", this.companyId)
      .eq("id", zoneId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async findByNormalizedNeighborhood(
    normalizedNeighborhood: string,
    ignoredZoneId?: string
  ) {
    let query = supabase
      .from("delivery_zones")
      .select("id, neighborhood")
      .eq("company_id", this.companyId)
      .eq(
        "normalized_neighborhood",
        normalizedNeighborhood
      );

    if (ignoredZoneId) {
      query = query.neq("id", ignoredZoneId);
    }

    const { data, error } = await query.limit(1);

    if (error) {
      throw new Error(error.message);
    }

    return data?.[0] ?? null;
  }

  async create(
    input: CreateDeliveryZoneInput,
    normalizedNeighborhood: string
  ) {
    const { data, error } = await supabase
      .from("delivery_zones")
      .insert({
        company_id: this.companyId,
        neighborhood: input.neighborhood,
        normalized_neighborhood:
          normalizedNeighborhood,
        delivery_fee: input.delivery_fee,
        estimated_delivery_cost:
          input.estimated_delivery_cost,
        is_active: input.is_active
      })
      .select(`
        id,
        company_id,
        neighborhood,
        normalized_neighborhood,
        delivery_fee,
        estimated_delivery_cost,
        is_active,
        created_at,
        updated_at
      `)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async update(
    zoneId: string,
    input: UpdateDeliveryZoneInput,
    normalizedNeighborhood?: string
  ) {
    const changes: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    };

    if (input.neighborhood !== undefined) {
      changes.neighborhood = input.neighborhood;
      changes.normalized_neighborhood =
        normalizedNeighborhood;
    }

    if (input.delivery_fee !== undefined) {
      changes.delivery_fee = input.delivery_fee;
    }

    if (
      input.estimated_delivery_cost !== undefined
    ) {
      changes.estimated_delivery_cost =
        input.estimated_delivery_cost;
    }

    const { data, error } = await supabase
      .from("delivery_zones")
      .update(changes)
      .eq("company_id", this.companyId)
      .eq("id", zoneId)
      .select(`
        id,
        company_id,
        neighborhood,
        normalized_neighborhood,
        delivery_fee,
        estimated_delivery_cost,
        is_active,
        created_at,
        updated_at
      `)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      throw new Error("DELIVERY_ZONE_NOT_FOUND");
    }

    return data;
  }

  async updateStatus(
    zoneId: string,
    isActive: boolean
  ) {
    const { data, error } = await supabase
      .from("delivery_zones")
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString()
      })
      .eq("company_id", this.companyId)
      .eq("id", zoneId)
      .select(`
        id,
        company_id,
        neighborhood,
        normalized_neighborhood,
        delivery_fee,
        estimated_delivery_cost,
        is_active,
        created_at,
        updated_at
      `)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      throw new Error("DELIVERY_ZONE_NOT_FOUND");
    }

    return data;
  }
}

export const deliveryZoneRepository =
  new DeliveryZoneRepository();
