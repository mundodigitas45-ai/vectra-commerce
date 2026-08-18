import { randomUUID } from "node:crypto";
import { supabase } from "../../config/supabase";
import { productRepository } from "./product.repository";
import type {
  CreateProductInput,
  ImportGoogleDriveMediaInput,
  UpdateProductInput
} from "./product.schemas";

const PRODUCT_MEDIA_BUCKET = "product-media";

const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const MAX_VIDEO_BYTES = 150 * 1024 * 1024;

const ALLOWED_MEDIA_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime"
];

function safeMediaFileName(value: string): string {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "produto-media";
}

function mediaLimit(contentType: string): number {
  return contentType.startsWith("video/")
    ? MAX_VIDEO_BYTES
    : MAX_IMAGE_BYTES;
}

function humanMediaLimit(contentType: string): string {
  return contentType.startsWith("video/")
    ? "150 MB"
    : "20 MB";
}

function createSlug(name: string): string {
  return name
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

  findById(productId: string) {
    return productRepository.findById(productId);
  }

  async importGoogleDriveMedia(
    input: ImportGoogleDriveMediaInput
  ) {
    const driveResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(
        input.file_id
      )}?alt=media`,
      {
        headers: {
          Authorization: `Bearer ${input.access_token}`
        }
      }
    );

    if (!driveResponse.ok) {
      const body = await driveResponse
        .text()
        .catch(() => "");

      throw new Error(
        `Não foi possível baixar a mídia do Google Drive (${driveResponse.status}). ${body}`.trim()
      );
    }

    const rawContentType =
      driveResponse.headers.get("content-type") ??
      input.mime_type;

    const contentType = rawContentType
      .split(";")[0]
      .trim()
      .toLowerCase();

    if (
      !ALLOWED_MEDIA_MIME_TYPES.includes(
        contentType
      )
    ) {
      throw new Error(
        "O arquivo selecionado não é uma imagem ou vídeo compatível."
      );
    }

    const maxBytes = mediaLimit(contentType);

    const contentLength = Number(
      driveResponse.headers.get(
        "content-length"
      ) ?? 0
    );

    if (contentLength > maxBytes) {
      throw new Error(
        `O arquivo é maior que o limite de ${humanMediaLimit(
          contentType
        )}.`
      );
    }

    const arrayBuffer =
      await driveResponse.arrayBuffer();

    if (arrayBuffer.byteLength > maxBytes) {
      throw new Error(
        `O arquivo é maior que o limite de ${humanMediaLimit(
          contentType
        )}.`
      );
    }

    const { error: bucketLookupError } =
      await supabase.storage.getBucket(
        PRODUCT_MEDIA_BUCKET
      );

    if (bucketLookupError) {
      const { error: createBucketError } =
        await supabase.storage.createBucket(
          PRODUCT_MEDIA_BUCKET,
          {
            public: true,
            fileSizeLimit:
              MAX_VIDEO_BYTES,
            allowedMimeTypes:
              ALLOWED_MEDIA_MIME_TYPES
          }
        );

      if (
        createBucketError &&
        !createBucketError.message
          .toLowerCase()
          .includes("already exists")
      ) {
        throw createBucketError;
      }
    }

    const fileName =
      `${randomUUID()}-${safeMediaFileName(
        input.file_name
      )}`;

    const folder =
      contentType.startsWith("video/")
        ? "videos"
        : "images";

    const storagePath =
      `products/${folder}/${fileName}`;

    const { error: uploadError } =
      await supabase.storage
        .from(PRODUCT_MEDIA_BUCKET)
        .upload(
          storagePath,
          Buffer.from(arrayBuffer),
          {
            contentType,
            upsert: false,
            cacheControl: "3600"
          }
        );

    if (uploadError) {
      throw uploadError;
    }

    const { data: publicUrlData } =
      supabase.storage
        .from(PRODUCT_MEDIA_BUCKET)
        .getPublicUrl(storagePath);

    return {
      source: "google_drive",
      drive_file_id: input.file_id,
      file_name: input.file_name,
      mime_type: contentType,
      storage_bucket:
        PRODUCT_MEDIA_BUCKET,
      storage_path: storagePath,
      public_url:
        publicUrlData.publicUrl
    };
  }

  async create(
    input: CreateProductInput,
    actorEmail: string
  ) {
    return productRepository.create(
      {
        ...input,
        slug:
          input.slug?.trim() ||
          createSlug(input.name)
      },
      actorEmail
    );
  }

  async update(
    productId: string,
    input: UpdateProductInput
  ) {
    const normalized = {
      ...input,
      slug:
        input.slug !== undefined
          ? createSlug(input.slug)
          : undefined
    };

    if (
      normalized.maximum_quantity !== undefined &&
      normalized.maximum_quantity !== null &&
      normalized.minimum_quantity !== undefined &&
      normalized.maximum_quantity <
        normalized.minimum_quantity
    ) {
      throw new Error("INVALID_MAXIMUM_QUANTITY");
    }

    return productRepository.update(
      productId,
      normalized
    );
  }

  updateStatus(
    productId: string,
    isActive: boolean
  ) {
    return productRepository.updateStatus(
      productId,
      isActive
    );
  }
}

export const productService =
  new ProductService();
