import { supabase } from "../../config/supabase";
import { CreateProductInput } from "./product.schemas";

const COMPANY_ID =
  "e2e1f5bc-3f6c-4868-9d9c-5c8226df9b3d";

const STORE_ID =
  "f4a134bb-00fc-4314-bcd5-9d5cd45f036d";

function createSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

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

  async create(input: CreateProductInput) {
    let slug = createSlug(input.name);

    const { data: existingProduct, error: searchError } =
      await supabase
        .from("products")
        .select("id")
        .eq("company_id", COMPANY_ID)
        .eq("slug", slug)
        .maybeSingle();

    if (searchError) {
      throw searchError;
    }

    if (existingProduct) {
      slug = `${slug}-${Date.now()}`;
    }

    const { data: product, error: productError } =
      await supabase
        .from("products")
        .insert({
          company_id: COMPANY_ID,
          category_id: input.category_id ?? null,
          name: input.name,
          slug,
          description: input.description ?? null,
          power_watts: input.power_watts ?? null,
          connector_type: input.connector_type ?? null,
          cost_price: input.cost_price,
          sale_price: input.sale_price,
          stock_quantity: input.stock_quantity,
          low_stock_threshold:
            input.low_stock_threshold ?? 3,
          warranty_days: input.warranty_days ?? 30,
          is_active: true,
          image_url: input.image_url ?? null,
          metadata: {}
        })
        .select("*")
        .single();

    if (productError || !product) {
      throw productError ?? new Error(
        "Não foi possível cadastrar o produto."
      );
    }

    const { data: inventory, error: inventoryError } =
      await supabase
        .from("inventories")
        .insert({
          company_id: COMPANY_ID,
          store_id: STORE_ID,
          product_id: product.id,
          physical_quantity: input.stock_quantity,
          reserved_quantity: 0,
          minimum_quantity:
            input.low_stock_threshold ?? 3,
          maximum_quantity: null,
          location_code: null,
          last_counted_at: new Date().toISOString()
        })
        .select("*")
        .single();

    if (inventoryError || !inventory) {
      await supabase
        .from("products")
        .delete()
        .eq("id", product.id);

      throw inventoryError ?? new Error(
        "Não foi possível criar o estoque do produto."
      );
    }

    return {
      product,
      inventory
    };
  }
}

export const productService = new ProductService();