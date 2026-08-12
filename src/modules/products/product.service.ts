import { randomUUID } from "node:crypto";
import { supabase } from "../../config/supabase";
import {
  CreateProductInput,
  ImportGoogleDriveMediaInput
} from "./product.schemas";

const COMPANY_ID =
  "e2e1f5bc-3f6c-4868-9d9c-5c8226df9b3d";

const STORE_ID =
  "f4a134bb-00fc-4314-bcd5-9d5cd45f036d";

const PRODUCT_MEDIA_BUCKET = "product-media";
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;

function createSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function safeFileName(value: string) {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "produto.jpg";
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

    const productIds = (data ?? [])
      .map((item) => item.product_id)
      .filter(Boolean);

    if (productIds.length === 0) {
      return data ?? [];
    }

    const { data: productMedia, error: mediaError } = await supabase
      .from("products")
      .select("id,image_url")
      .in("id", productIds);

    if (mediaError) {
      throw mediaError;
    }

    const imageByProductId = new Map(
      (productMedia ?? []).map((item) => [item.id, item.image_url])
    );

    return (data ?? []).map((item) => ({
      ...item,
      image_url: imageByProductId.get(item.product_id) ?? null
    }));
  }

  async importGoogleDriveMedia(input: ImportGoogleDriveMediaInput) {
    const driveResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(input.file_id)}?alt=media`,
      {
        headers: {
          Authorization: `Bearer ${input.access_token}`
        }
      }
    );

    if (!driveResponse.ok) {
      const body = await driveResponse.text().catch(() => "");
      throw new Error(
        `Não foi possível baixar a imagem do Google Drive (${driveResponse.status}). ${body}`.trim()
      );
    }

    const contentType =
      driveResponse.headers.get("content-type") ?? input.mime_type;

    if (!contentType.startsWith("image/")) {
      throw new Error("O arquivo selecionado não é uma imagem válida.");
    }

    const contentLength = Number(
      driveResponse.headers.get("content-length") ?? 0
    );

    if (contentLength > MAX_IMAGE_BYTES) {
      throw new Error("A imagem é maior que o limite de 20 MB.");
    }

    const arrayBuffer = await driveResponse.arrayBuffer();

    if (arrayBuffer.byteLength > MAX_IMAGE_BYTES) {
      throw new Error("A imagem é maior que o limite de 20 MB.");
    }

    const { error: bucketLookupError } = await supabase.storage
      .getBucket(PRODUCT_MEDIA_BUCKET);

    if (bucketLookupError) {
      const { error: createBucketError } = await supabase.storage
        .createBucket(PRODUCT_MEDIA_BUCKET, {
          public: true,
          fileSizeLimit: MAX_IMAGE_BYTES,
          allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"]
        });

      if (
        createBucketError &&
        !createBucketError.message.toLowerCase().includes("already exists")
      ) {
        throw createBucketError;
      }
    }

    const fileName = `${randomUUID()}-${safeFileName(input.file_name)}`;
    const storagePath = `products/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(PRODUCT_MEDIA_BUCKET)
      .upload(storagePath, Buffer.from(arrayBuffer), {
        contentType,
        upsert: false,
        cacheControl: "3600"
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data: publicUrlData } = supabase.storage
      .from(PRODUCT_MEDIA_BUCKET)
      .getPublicUrl(storagePath);

    return {
      source: "google_drive",
      drive_file_id: input.file_id,
      file_name: input.file_name,
      mime_type: contentType,
      storage_bucket: PRODUCT_MEDIA_BUCKET,
      storage_path: storagePath,
      public_url: publicUrlData.publicUrl
    };
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
