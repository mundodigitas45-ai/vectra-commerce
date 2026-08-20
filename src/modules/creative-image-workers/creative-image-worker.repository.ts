import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { supabase } from "../../config/supabase";
import type {
  ClaimCreativeImageJobInput,
  CompleteCreativeImageJobInput,
  CreativeImageFormat,
  FailCreativeImageJobInput
} from "./creative-image-worker.schemas";

const imageTargets: Record<
  CreativeImageFormat,
  { width: number; height: number }
> = {
  square: { width: 1080, height: 1080 },
  feed_portrait: { width: 1080, height: 1350 },
  story: { width: 1080, height: 1920 },
  landscape: { width: 1200, height: 628 }
};

function repositoryError(
  error: { message: string; code?: string }
): Error & { code?: string } {
  const result = new Error(error.message) as Error & {
    code?: string;
  };

  result.code = error.code;
  return result;
}

function domainError(
  code: string,
  message: string
): Error & { code?: string } {
  const error = new Error(message) as Error & {
    code?: string;
  };

  error.code = code;
  return error;
}

function recordValue(
  value: unknown
): Record<string, unknown> {
  return value && typeof value === "object"
    ? value as Record<string, unknown>
    : {};
}

function stringValue(
  value: unknown
): string | null {
  return typeof value === "string"
    ? value
    : null;
}

function decodeImageBase64(value: string): Buffer {
  const normalized = value.includes(",")
    ? value.slice(value.indexOf(",") + 1)
    : value;

  const buffer = Buffer.from(normalized, "base64");

  if (buffer.length === 0) {
    throw domainError(
      "CREATIVE_IMAGE_INVALID",
      "A imagem recebida está vazia."
    );
  }

  return buffer;
}

export class CreativeImageWorkerRepository {
  async claim(input: ClaimCreativeImageJobInput) {
    const { data, error } = await supabase.rpc(
      "claim_next_creative_image_job",
      {
        p_worker_id: input.worker_id,
        p_lease_seconds: input.lease_seconds
      }
    );

    if (error) throw repositoryError(error);

    const job = Array.isArray(data)
      ? data[0] ?? null
      : data ?? null;

    if (!job) return null;

    const jobInput = recordValue(job.input);
    const formatKey = stringValue(
      jobInput.format_key
    ) as CreativeImageFormat | null;

    if (
      !formatKey ||
      !(formatKey in imageTargets) ||
      !job.channel_id
    ) {
      throw domainError(
        "CREATIVE_IMAGE_JOB_INVALID",
        "O job visual não possui canal e formato válidos."
      );
    }

    const { data: campaign, error: campaignError } =
      await supabase
        .from("creative_campaigns")
        .select(
          "id, company_id, workspace_id, product_id, title, objective, primary_destination, audience, locale, include_price, status, brief, creative_campaign_channels(id, platform, formats, status, configuration)"
        )
        .eq("id", job.campaign_id)
        .eq("company_id", job.company_id)
        .single();

    if (campaignError) {
      throw repositoryError(campaignError);
    }

    const channel = Array.isArray(
      campaign.creative_campaign_channels
    )
      ? campaign.creative_campaign_channels.find(
          (item) => item.id === job.channel_id
        ) ?? null
      : null;

    if (!channel) {
      throw domainError(
        "CREATIVE_CHANNEL_NOT_FOUND",
        "O canal visual não pertence à campanha."
      );
    }

    let product = null;
    let productMedia: unknown[] = [];

    if (campaign.product_id) {
      const [productResult, mediaResult] =
        await Promise.all([
          supabase
            .from("products")
            .select(
              "id, company_id, name, slug, description, sale_price, is_active"
            )
            .eq("id", campaign.product_id)
            .eq("company_id", campaign.company_id)
            .maybeSingle(),
          supabase
            .from("product_media")
            .select(
              "id, media_type, mime_type, public_url, alt_text, is_primary, sort_order"
            )
            .eq("product_id", campaign.product_id)
            .eq("company_id", campaign.company_id)
            .eq("media_type", "image")
            .eq("is_active", true)
            .order("is_primary", { ascending: false })
            .order("sort_order", { ascending: true })
            .limit(5)
        ]);

      if (productResult.error) {
        throw repositoryError(productResult.error);
      }

      if (mediaResult.error) {
        throw repositoryError(mediaResult.error);
      }

      product = productResult.data;
      productMedia = mediaResult.data ?? [];
    }

    const [brandResult, copyResult] =
      await Promise.all([
        supabase
          .from("creative_brand_profiles")
          .select("*")
          .eq("company_id", campaign.company_id)
          .maybeSingle(),
        supabase
          .from("creative_assets")
          .select(
            "id, version, content, approved_at"
          )
          .eq("company_id", campaign.company_id)
          .eq("campaign_id", campaign.id)
          .eq("channel_id", job.channel_id)
          .eq("asset_type", "copy")
          .eq("status", "approved")
          .order("version", { ascending: false })
          .limit(1)
          .maybeSingle()
      ]);

    if (brandResult.error) {
      throw repositoryError(brandResult.error);
    }

    if (copyResult.error) {
      throw repositoryError(copyResult.error);
    }

    if (!copyResult.data) {
      throw domainError(
        "CREATIVE_APPROVED_COPY_REQUIRED",
        "O canal precisa de uma copy aprovada antes da imagem."
      );
    }

    return {
      job,
      campaign: {
        ...campaign,
        creative_campaign_channels: undefined
      },
      channel,
      product,
      product_media: productMedia,
      brand_profile: brandResult.data,
      approved_copy: copyResult.data,
      format: {
        key: formatKey,
        ...imageTargets[formatKey]
      }
    };
  }

  private async activeJob(
    jobId: string,
    workerId: string
  ) {
    const { data, error } = await supabase
      .from("creative_jobs")
      .select(
        "id, company_id, campaign_id, channel_id, job_type, status, locked_by, input, created_by"
      )
      .eq("id", jobId)
      .eq("job_type", "image")
      .eq("status", "running")
      .eq("locked_by", workerId)
      .maybeSingle();

    if (error) throw repositoryError(error);

    if (!data) {
      throw domainError(
        "CREATIVE_IMAGE_JOB_LEASE_INVALID",
        "O job visual não está ativo para este executor."
      );
    }

    return data;
  }

  async complete(
    jobId: string,
    input: CompleteCreativeImageJobInput
  ) {
    const job = await this.activeJob(
      jobId,
      input.worker_id
    );

    const jobInput = recordValue(job.input);
    const expectedFormat =
      stringValue(jobInput.format_key);

    if (
      job.channel_id !== input.channel_id ||
      expectedFormat !== input.format_key
    ) {
      throw domainError(
        "CREATIVE_IMAGE_JOB_MISMATCH",
        "A imagem não corresponde ao canal e formato reservados."
      );
    }

    const target = imageTargets[input.format_key];
    const sourceBuffer = decodeImageBase64(
      input.image_base64
    );

    let outputBuffer: Buffer;

    try {
      outputBuffer = await sharp(sourceBuffer, {
        failOn: "warning"
      })
        .rotate()
        .resize(target.width, target.height, {
          fit: "cover",
          position: "centre"
        })
        .webp({
          quality: 92,
          effort: 5
        })
        .toBuffer();
    } catch {
      throw domainError(
        "CREATIVE_IMAGE_INVALID",
        "A imagem recebida não pôde ser processada."
      );
    }

    const storagePath = [
      job.company_id,
      job.campaign_id,
      input.channel_id,
      input.format_key,
      `${job.id}-${randomUUID()}.webp`
    ].join("/");

    const { error: uploadError } = await supabase.storage
      .from("creative-assets")
      .upload(storagePath, outputBuffer, {
        contentType: "image/webp",
        cacheControl: "31536000",
        upsert: false
      });

    if (uploadError) {
      throw repositoryError(uploadError);
    }

    const { data: publicData } = supabase.storage
      .from("creative-assets")
      .getPublicUrl(storagePath);

    const publicUrl = publicData.publicUrl;

    const { data: inserted, error: assetError } =
      await supabase.rpc(
        "insert_creative_image_asset_version",
        {
          p_company_id: job.company_id,
          p_campaign_id: job.campaign_id,
          p_channel_id: input.channel_id,
          p_job_id: job.id,
          p_format_key: input.format_key,
          p_content: input.content,
          p_storage_bucket: "creative-assets",
          p_storage_path: storagePath,
          p_public_url: publicUrl,
          p_mime_type: "image/webp",
          p_width: target.width,
          p_height: target.height,
          p_prompt: input.prompt,
          p_metadata: {
            ...input.metadata,
            source: "gpt-image-2",
            original_bytes: sourceBuffer.length,
            output_bytes: outputBuffer.length
          },
          p_created_by: job.created_by
        }
      );

    if (assetError) {
      await supabase.storage
        .from("creative-assets")
        .remove([storagePath])
        .catch(() => undefined);

      throw repositoryError(assetError);
    }

    const asset = Array.isArray(inserted)
      ? inserted[0] ?? null
      : inserted ?? null;

    const { data: completedJob, error: jobError } =
      await supabase
        .from("creative_jobs")
        .update({
          status: "completed",
          provider: "openai",
          model: "gpt-image-2",
          output: {
            ...input.output,
            asset,
            format_key: input.format_key,
            public_url: publicUrl,
            width: target.width,
            height: target.height
          },
          completed_at: new Date().toISOString(),
          lease_expires_at: null
        })
        .eq("id", job.id)
        .eq("status", "running")
        .eq("locked_by", input.worker_id)
        .select(
          "id, campaign_id, channel_id, status, provider, model, output, completed_at"
        )
        .single();

    if (jobError) throw repositoryError(jobError);

    return completedJob;
  }

  async fail(
    jobId: string,
    input: FailCreativeImageJobInput
  ) {
    const job = await this.activeJob(
      jobId,
      input.worker_id
    );

    const { data, error } = await supabase
      .from("creative_jobs")
      .update({
        status: "failed",
        output: input.output,
        error_code: input.error_code,
        error_message: input.error_message,
        completed_at: new Date().toISOString(),
        lease_expires_at: null
      })
      .eq("id", job.id)
      .eq("status", "running")
      .eq("locked_by", input.worker_id)
      .select(
        "id, campaign_id, channel_id, status, error_code, error_message, completed_at"
      )
      .single();

    if (error) throw repositoryError(error);
    return data;
  }
}

export const creativeImageWorkerRepository =
  new CreativeImageWorkerRepository();
