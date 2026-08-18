import { supabase } from "../../config/supabase";

const COMPANY_ID =
  process.env.COMPANY_ID ?? "e2e1f5bc-3f6c-4868-9d9c-5c8226df9b3d";

export class CheckoutRepository {
  async findActiveSiteByDomain(domain: string) {
    const normalizedDomain = String(domain || "")
      .trim()
      .toLowerCase()
      .replace(/:\\d+$/, "")
      .replace(/\\.$/, "");

    if (!normalizedDomain) {
      return null;
    }

    const { data, error } = await supabase
      .from("sites")
      .select("id,company_id,store_id,domain,is_active")
      .eq("company_id", COMPANY_ID)
      .eq("domain", normalizedDomain)
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data;
  }

  async listPublicProducts() {
    const { data: products, error: productError } = await supabase
      .from("products")
      .select(`
        id,
        name,
        slug,
        description,
        sale_price,
        image_url,
        power_watts,
        connector_type,
        warranty_days,
        is_active
      `)
      .eq("company_id", COMPANY_ID)
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (productError) {
      throw productError;
    }

    const productIds = (products ?? []).map((product) => product.id);

    if (productIds.length === 0) {
      return [];
    }

    const { data: inventories, error: inventoryError } = await supabase
      .from("inventories")
      .select("product_id,physical_quantity,reserved_quantity")
      .eq("company_id", COMPANY_ID)
      .in("product_id", productIds);

    if (inventoryError) {
      throw inventoryError;
    }

    const availableByProduct = new Map<string, number>();

    for (const inventory of inventories ?? []) {
      const available = Math.max(
        Number(inventory.physical_quantity ?? 0) -
          Number(inventory.reserved_quantity ?? 0),
        0
      );

      availableByProduct.set(
        inventory.product_id,
        (availableByProduct.get(inventory.product_id) ?? 0) + available
      );
    }

    return (products ?? []).map((product) => ({
      ...product,
      available_quantity: availableByProduct.get(product.id) ?? 0
    }));
  }

  async findProductBySlug(slug: string) {
    const { data: product, error: productError } = await supabase
      .from("products")
      .select(`
        id,
        name,
        slug,
        description,
        sale_price,
        power_watts,
        connector_type,
        image_url,
        warranty_days,
        is_active
      `)
      .eq("company_id", COMPANY_ID)
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();

    if (productError) {
      throw productError;
    }

    if (!product) {
      return null;
    }

    const { data: inventories, error: inventoryError } = await supabase
      .from("inventories")
      .select("physical_quantity,reserved_quantity")
      .eq("company_id", COMPANY_ID)
      .eq("product_id", product.id);

    if (inventoryError) {
      throw inventoryError;
    }

    const availableQuantity = (inventories ?? []).reduce(
      (total, inventory) =>
        total +
        Math.max(
          Number(inventory.physical_quantity ?? 0) -
            Number(inventory.reserved_quantity ?? 0),
          0
        ),
      0
    );

    const { data: tiers, error: tierError } = await supabase
      .from("product_price_tiers")
      .select("quantity,fixed_total_price,is_active")
      .eq("product_id", product.id)
      .eq("is_active", true)
      .order("quantity", { ascending: true });

    if (tierError) {
      throw tierError;
    }

    return {
      ...product,
      available_quantity: availableQuantity,
      price_tiers: tiers ?? []
    };
  }

  async listActiveProductImages(productId: string) {
    const { data, error } = await supabase
      .from("product_media")
      .select("public_url,is_primary,sort_order,created_at")
      .eq("company_id", COMPANY_ID)
      .eq("product_id", productId)
      .eq("media_type", "image")
      .eq("is_active", true)
      .not("public_url", "is", null)
      .order("is_primary", { ascending: false })
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      throw error;
    }

    return (data ?? [])
      .map((media) => String(media.public_url ?? "").trim())
      .filter(Boolean);
  }

  async findProductById(productId: string) {
    const { data, error } = await supabase
      .from("products")
      .select("id,name,slug,sale_price,is_active")
      .eq("company_id", COMPANY_ID)
      .eq("id", productId)
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data;
  }

  async getAvailableQuantity(productId: string) {
    const { data, error } = await supabase
      .from("inventories")
      .select("physical_quantity,reserved_quantity")
      .eq("company_id", COMPANY_ID)
      .eq("product_id", productId);

    if (error) {
      throw error;
    }

    return (data ?? []).reduce(
      (total, inventory) =>
        total +
        Math.max(
          Number(inventory.physical_quantity ?? 0) -
            Number(inventory.reserved_quantity ?? 0),
          0
        ),
      0
    );
  }

  async findPriceTier(productId: string, quantity: number) {
    const { data, error } = await supabase
      .from("product_price_tiers")
      .select("quantity,fixed_total_price")
      .eq("product_id", productId)
      .eq("quantity", quantity)
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data;
  }

  async listDeliveryZones() {
    const { data, error } = await supabase
      .from("delivery_zones")
      .select("id,city,neighborhood,delivery_fee,is_active")
      .eq("company_id", COMPANY_ID)
      .eq("is_active", true)
      .order("neighborhood", { ascending: true });

    if (error) {
      throw error;
    }

    return data ?? [];
  }

  async listDeviceModels() {
    const { data, error } = await supabase
      .from("device_models")
      .select(`
        id,
        brand,
        model,
        normalized_brand,
        normalized_model,
        aliases,
        connector_type,
        official_max_watts,
        active
      `)
      .eq("company_id", COMPANY_ID)
      .eq("active", true)
      .order("brand", { ascending: true })
      .order("model", { ascending: true });

    if (error) {
      throw error;
    }

    return data ?? [];
  }

  async findDeviceModel(brand: string, model: string) {
    const normalizedBrand = normalizeText(brand);
    const normalizedModel = normalizeText(model);

    const { data, error } = await supabase
      .from("device_models")
      .select(`
        id,
        brand,
        model,
        normalized_brand,
        normalized_model,
        aliases,
        connector_type,
        official_max_watts,
        official_protocols,
        active
      `)
      .eq("company_id", COMPANY_ID)
      .eq("active", true)
      .eq("normalized_brand", normalizedBrand)
      .eq("normalized_model", normalizedModel)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data;
  }

  async listCompatibilityByDeviceModel(deviceModelId: string) {
    const { data, error } = await supabase
      .from("charger_compatibility_catalog")
      .select(`
        company_id,
        product_id,
        product_name,
        device_model_id,
        brand,
        model,
        connector_type,
        official_max_watts,
        charging_supported,
        fast_charging_possible,
        full_power_guaranteed,
        compatibility_level,
        approved_answer,
        notes,
        active
      `)
      .eq("company_id", COMPANY_ID)
      .eq("device_model_id", deviceModelId)
      .eq("active", true);

    if (error) {
      throw error;
    }

    return data ?? [];
  }

  async getPublicProductSummary(productId: string) {
    const { data: product, error: productError } = await supabase
      .from("products")
      .select(`
        id,
        name,
        slug,
        sale_price,
        image_url,
        power_watts,
        connector_type,
        is_active
      `)
      .eq("company_id", COMPANY_ID)
      .eq("id", productId)
      .eq("is_active", true)
      .maybeSingle();

    if (productError) {
      throw productError;
    }

    if (!product) {
      return null;
    }

    const availableQuantity = await this.getAvailableQuantity(productId);

    return {
      ...product,
      available_quantity: availableQuantity
    };
  }


  async findDeliveryZone(neighborhood: string) {
    const zones = await this.listDeliveryZones();
    const normalized = normalizeText(neighborhood);

    return (
      zones.find(
        (zone) => normalizeText(String(zone.neighborhood ?? "")) === normalized
      ) ?? null
    );
  }
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\+/g, " plus ")
    .trim()
    .replace(/\s+/g, " ");
}

export const checkoutRepository = new CheckoutRepository();
