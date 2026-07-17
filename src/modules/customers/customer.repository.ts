import { supabase } from "../../config/supabase";
import type { CreateCustomerInput } from "./customer.schemas";

const COMPANY_ID =
  "e2e1f5bc-3f6c-4868-9d9c-5c8226df9b3d";

export class CustomerRepository {
  async list() {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("company_id", COMPANY_ID)
      .order("created_at", {
        ascending: false
      })
      .limit(100);

    if (error) {
      throw new Error(error.message);
    }

    return data ?? [];
  }

  async findByPhone(phone: string) {
    const { data, error } = await supabase
      .from("customers")
      .select("id, name, phone")
      .eq("company_id", COMPANY_ID)
      .eq("phone", phone)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async create(input: CreateCustomerInput) {
    const { data, error } = await supabase
      .from("customers")
      .insert({
        company_id: COMPANY_ID,
        name: input.name ?? null,
        phone: input.phone,
        email: input.email ?? null,
        neighborhood: input.neighborhood ?? null,
        address: input.address ?? null,
        reference: input.reference ?? null,
        latitude: null,
        longitude: null,
        notes: input.notes ?? null,
        is_active: true
      })
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }
}

export const customerRepository =
  new CustomerRepository();