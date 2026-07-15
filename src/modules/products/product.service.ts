import { supabase } from "../../config/supabase";

export class ProductService {
  async list() {
    const { data, error } = await supabase
      .from("inventory_summary")
      .select(`
        product_id,
        product_name,
        product_slug,
        sale_price,
        cost_price,
        available_quantity,
        minimum_quantity,
        is_low_stock
      `)
      .order("product_name");

    if (error) {
      throw error;
    }

    return data;
  }
}

export const productService = new ProductService();
