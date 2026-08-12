import { supabase } from "../../config/supabase";
import { productService } from "./product.service";
import {
  ImportGoogleDriveMediaInput,
  UpdateProductMediaInput
} from "./product.schemas";

const COMPANY_ID = "e2e1f5bc-3f6c-4868-9d9c-5c8226df9b3d";

export class ProductMediaService {
  private async requireProduct(productId: string) {
    const { data, error } = await supabase
      .from("products")
      .select("id,company_id,name")
      .eq("id", productId)
      .eq("company_id", COMPANY_ID)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error("Produto não encontrado.");
    return data;
  }

  async list(productId: string) {
    await this.requireProduct(productId);

    const { data, error } = await supabase
      .from("product_media")
      .select("*")
      .eq("company_id", COMPANY_ID)
      .eq("product_id", productId)
      .order("is_primary", { ascending: false })
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data ?? [];
  }

  async importGoogleDrive(productId: string, input: ImportGoogleDriveMediaInput) {
    const product = await this.requireProduct(productId);
    const imported = await productService.importGoogleDriveMedia(input);
    const mediaType = imported.mime_type.startsWith("video/") ? "video" : "image";

    let isPrimary = input.is_primary ?? false;
    if (mediaType === "image" && !isPrimary) {
      const { count, error: countError } = await supabase
        .from("product_media")
        .select("id", { count: "exact", head: true })
        .eq("company_id", COMPANY_ID)
        .eq("product_id", productId)
        .eq("media_type", "image")
        .eq("is_active", true);

      if (countError) throw countError;
      isPrimary = (count ?? 0) === 0;
    }

    if (isPrimary) {
      const { error: demoteError } = await supabase
        .from("product_media")
        .update({ is_primary: false, updated_at: new Date().toISOString() })
        .eq("company_id", COMPANY_ID)
        .eq("product_id", productId)
        .eq("is_primary", true);
      if (demoteError) throw demoteError;
    }

    const { data, error } = await supabase
      .from("product_media")
      .insert({
        company_id: product.company_id,
        product_id: product.id,
        media_type: mediaType,
        source: "google_drive",
        drive_file_id: imported.drive_file_id,
        file_name: imported.file_name,
        mime_type: imported.mime_type,
        storage_bucket: imported.storage_bucket,
        storage_path: imported.storage_path,
        public_url: imported.public_url,
        alt_text: input.alt_text ?? product.name,
        is_primary: isPrimary,
        sort_order: input.sort_order ?? 0,
        is_active: true
      })
      .select("*")
      .single();

    if (error) {
      await supabase.storage
        .from(imported.storage_bucket)
        .remove([imported.storage_path])
        .catch(() => undefined);
      throw error;
    }

    return data;
  }

  async update(productId: string, mediaId: string, input: UpdateProductMediaInput) {
    await this.requireProduct(productId);

    if (input.is_primary === true) {
      const { error: demoteError } = await supabase
        .from("product_media")
        .update({ is_primary: false, updated_at: new Date().toISOString() })
        .eq("company_id", COMPANY_ID)
        .eq("product_id", productId)
        .neq("id", mediaId)
        .eq("is_primary", true);
      if (demoteError) throw demoteError;
    }

    const { data, error } = await supabase
      .from("product_media")
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq("id", mediaId)
      .eq("company_id", COMPANY_ID)
      .eq("product_id", productId)
      .select("*")
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error("Mídia não encontrada.");
    return data;
  }

  async remove(productId: string, mediaId: string) {
    await this.requireProduct(productId);

    const { data: media, error: lookupError } = await supabase
      .from("product_media")
      .select("id,storage_bucket,storage_path")
      .eq("id", mediaId)
      .eq("company_id", COMPANY_ID)
      .eq("product_id", productId)
      .maybeSingle();

    if (lookupError) throw lookupError;
    if (!media) throw new Error("Mídia não encontrada.");

    const { error } = await supabase
      .from("product_media")
      .delete()
      .eq("id", mediaId)
      .eq("company_id", COMPANY_ID)
      .eq("product_id", productId);

    if (error) throw error;

    if (media.storage_bucket && media.storage_path) {
      await supabase.storage
        .from(media.storage_bucket)
        .remove([media.storage_path])
        .catch(() => undefined);
    }

    return { id: mediaId, deleted: true };
  }
}

export const productMediaService = new ProductMediaService();
