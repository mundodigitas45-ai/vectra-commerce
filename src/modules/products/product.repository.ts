import { supabase } from "../../config/supabase";
import type {
  CreateProductInput,
  UpdateProductInput
} from "./product.schemas";

function requiredEnvironment(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name}_NOT_CONFIGURED`);
  }

  return value;
}

export class ProductRepository {
  async create(
    input: CreateProductInput,
    actorEmail: string
  ) {
    const companyId = requiredEnvironment("COMPANY_ID");
    const storeId = requiredEnvironment("STORE_ID");

    const { data, error } = await supabase.rpc(
      "create_product_with_inventory",
      {
        p_company_id: companyId,
        p_store_id: storeId,
        p_name: input.name,
        p_slug: input.slug,
        p_description: input.description ?? null,
        p_power_watts: input.power_watts ?? null,
        p_connector_type: input.connector_type ?? null,
        p_cost_price: input.cost_price,
        p_sale_price: input.sale_price,
        p_initial_stock: input.initial_stock,
        p_minimum_quantity: input.minimum_quantity,
        p_maximum_quantity: input.maximum_quantity ?? null,
        p_warranty_days: input.warranty_days,
        p_image_url: input.image_url ?? null,
        p_category_id: input.category_id ?? null,
        p_metadata: input.metadata ?? {},
        p_actor_email: actorEmail
      }
    );

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async findById(productId: string) {
    const companyId = requiredEnvironment("COMPANY_ID");

    const { data, error } = await supabase
      .from("products")
      .select(`
        id,
        company_id,
        category_id,
        name,
        slug,
        description,
        power_watts,
        connector_type,
        cost_price,
        sale_price,
        stock_quantity,
        low_stock_threshold,
        warranty_days,
        is_active,
        image_url,
        metadata,
        created_at,
        updated_at,
        inventories (
          id,
          physical_quantity,
          reserved_quantity,
          minimum_quantity,
          maximum_quantity,
          location_code,
          updated_at
        )
      `)
      .eq("company_id", companyId)
      .eq("id", productId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async update(
    productId: string,
    input: UpdateProductInput
  ) {
    const companyId = requiredEnvironment("COMPANY_ID");

    const productUpdate: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    };

    const inventoryUpdate: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    };

    const productFields = [
      "name",
      "slug",
      "description",
      "power_watts",
      "connector_type",
      "cost_price",
      "sale_price",
      "warranty_days",
      "image_url",
      "category_id",
      "metadata"
    ] as const;

    for (const field of productFields) {
      if (field in input) {
        productUpdate[field] = input[field];
      }
    }

    if ("minimum_quantity" in input) {
      inventoryUpdate.minimum_quantity =
        input.minimum_quantity;

      productUpdate.low_stock_threshold =
        input.minimum_quantity;
    }

    if ("maximum_quantity" in input) {
      inventoryUpdate.maximum_quantity =
        input.maximum_quantity;
    }

    const { data: product, error: productError } =
      await supabase
        .from("products")
        .update(productUpdate)
        .eq("company_id", companyId)
        .eq("id", productId)
        .select()
        .maybeSingle();

    if (productError) {
      throw new Error(productError.message);
    }

    if (!product) {
      throw new Error("PRODUCT_NOT_FOUND");
    }

    if (
      "minimum_quantity" in input ||
      "maximum_quantity" in input
    ) {
      const { error: inventoryError } =
        await supabase
          .from("inventories")
          .update(inventoryUpdate)
          .eq("company_id", companyId)
          .eq("product_id", productId);

      if (inventoryError) {
        throw new Error(inventoryError.message);
      }
    }

    return this.findById(productId);
  }

  async archive(
    productId: string,
    actorEmail: string
  ) {
    const companyId =
      requiredEnvironment("COMPANY_ID");

    const current =
      await this.findById(productId);

    if (!current) {
      throw new Error("PRODUCT_NOT_FOUND");
    }

    const metadata =
      current.metadata &&
      typeof current.metadata === "object" &&
      !Array.isArray(current.metadata)
        ? current.metadata as Record<
            string,
            unknown
          >
        : {};

    if (metadata.archived_at) {
      throw new Error(
        "PRODUCT_ALREADY_ARCHIVED"
      );
    }

    const archivedAt =
      new Date().toISOString();

    const { data, error } = await supabase
      .from("products")
      .update({
        is_active: false,
        metadata: {
          ...metadata,
          archived_at: archivedAt,
          archived_by: actorEmail,
          archive_reason:
            "Removido pelo administrador no painel"
        },
        updated_at: archivedAt
      })
      .eq("company_id", companyId)
      .eq("id", productId)
      .select(
        "id,name,is_active,metadata,updated_at"
      )
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      throw new Error("PRODUCT_NOT_FOUND");
    }

    return {
      ...data,
      archived_at: archivedAt
    };
  }

  async updateStatus(
    productId: string,
    isActive: boolean
  ) {
    const companyId = requiredEnvironment("COMPANY_ID");

    const { data, error } = await supabase
      .from("products")
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString()
      })
      .eq("company_id", companyId)
      .eq("id", productId)
      .select()
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      throw new Error("PRODUCT_NOT_FOUND");
    }

    return data;
  }
}

export const productRepository =
  new ProductRepository();
