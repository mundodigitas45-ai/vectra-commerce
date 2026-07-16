import { supabase } from "../../config/supabase";

export class CustomerRepository {
  async list() {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .limit(100);

    if (error) {
      throw new Error(error.message);
    }

    return data ?? [];
  }
}

export const customerRepository = new CustomerRepository();