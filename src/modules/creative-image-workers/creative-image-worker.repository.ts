import { randomUUID } from "node:crypto";
import { supabase } from "../../config/supabase";
import { composeLockedCreative } from "./creative-image-compositor";
import { requireSelectedRealPhoto } from "./real-photo-identity";
import {
  composeProfessionalRealPhoto,
  type ConfirmedPhotoOffer,
  type CreativeVisualPlan
} from "./professional-real-photo-compositor";
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

const MIRANDA_EXPRESS_COMPANY_ID = "e2e1f5bc-3f6c-4868-9d9c-5c8226df9b3d";

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

    const campaignBrief = recordValue(campaign.brief);
    const realPhotoMode = campaignBrief.fidelity_mode === "real_photo";
    if (realPhotoMode && job.company_id !== MIRANDA_EXPRESS_COMPANY_ID) {
      throw domainError(
        "CREATIVE_REAL_PHOTO_BRAND_UNAVAILABLE",
        "Este modelo comercial ainda não foi configurado para esta empresa."
      );
    }
    const selectedMediaId = stringValue(campaignBrief.real_photo_media_id);
    if (realPhotoMode && !selectedMediaId) {
      requireSelectedRealPhoto(null, selectedMediaId);
    }

    let product = null;
    let productMedia: unknown[] = [];

    if (campaign.product_id) {
      const mediaQuery = supabase
        .from("product_media")
        .select(
          "id, media_type, mime_type, source, file_name, public_url, alt_text, is_primary, sort_order"
        )
        .eq("product_id", campaign.product_id)
        .eq("company_id", campaign.company_id)
        .eq("media_type", "image")
        .eq("is_active", true)
        .order("is_primary", { ascending: false })
        .order("sort_order", { ascending: true });

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
          realPhotoMode
            ? mediaQuery.eq("id", selectedMediaId!)
            : mediaQuery.limit(5)
        ]);

      if (productResult.error) {
        throw repositoryError(productResult.error);
      }

      if (mediaResult.error) {
        throw repositoryError(mediaResult.error);
      }

      product = productResult.data;
      productMedia = mediaResult.data ?? [];
      if (realPhotoMode) {
        requireSelectedRealPhoto(productMedia[0] as { id: string; source?: string | null; file_name?: string | null; mime_type?: string | null } | undefined, selectedMediaId);
      }
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

    const { data: campaign, error: campaignError } =
      await supabase
        .from("creative_campaigns")
        .select("id, company_id, product_id, brief")
        .eq("id", job.campaign_id)
        .eq("company_id", job.company_id)
        .maybeSingle();

    if (campaignError) throw repositoryError(campaignError);

    if (!campaign?.product_id) {
      throw domainError(
        "CREATIVE_PRODUCT_REQUIRED",
        "A campanha precisa possuir um produto selecionado."
      );
    }

    const [
      productResult,
      referenceResult,
      brandResult
    ] = await Promise.all([
        supabase
          .from("products")
          .select("id, name, sale_price")
          .eq("id", campaign.product_id)
          .eq("company_id", job.company_id)
          .eq("is_active", true)
          .maybeSingle(),
        supabase
          .from("product_media")
          .select("id, product_id, public_url, source, file_name, mime_type")
          .eq("company_id", job.company_id)
          .eq("product_id", campaign.product_id)
          .eq("public_url", input.reference_image_url)
          .eq("media_type", "image")
          .eq("is_active", true)
          .maybeSingle(),
        supabase
          .from("creative_brand_profiles")
          .select("logo_url")
          .eq("company_id", job.company_id)
          .maybeSingle()
      ]);

    if (productResult.error) {
      throw repositoryError(productResult.error);
    }

    if (referenceResult.error) {
      throw repositoryError(referenceResult.error);
    }

    if (brandResult.error) {
      throw repositoryError(brandResult.error);
    }

    if (!productResult.data) {
      throw domainError(
        "CREATIVE_PRODUCT_NOT_FOUND",
        "O produto da campanha não está disponível."
      );
    }

    if (!referenceResult.data) {
      throw domainError(
        "CREATIVE_REFERENCE_PRODUCT_MISMATCH",
        "A foto enviada não pertence ao produto da campanha."
      );
    }

    const brief = recordValue(campaign.brief);
    const realPhotoMode = brief.fidelity_mode === "real_photo";
    if (realPhotoMode && job.company_id !== MIRANDA_EXPRESS_COMPANY_ID) {
      throw domainError(
        "CREATIVE_REAL_PHOTO_BRAND_UNAVAILABLE",
        "Este modelo comercial ainda não foi configurado para esta empresa."
      );
    }
    if (realPhotoMode !== (input.composition_mode === "professional_real_photo_v1")) {
      throw domainError(
        "CREATIVE_COMPOSITION_MODE_MISMATCH",
        "O modo de composição não corresponde à campanha."
      );
    }
    if (realPhotoMode) {
      requireSelectedRealPhoto(
        referenceResult.data,
        stringValue(brief.real_photo_media_id)
      );
    }

    const target = imageTargets[input.format_key];

    const protectedContent: Record<string, unknown> = {
      ...input.content,
      product_name: productResult.data.name,
      sale_price: productResult.data.sale_price,
      logo_url: brandResult.data?.logo_url ?? null
    };

    let outputBuffer: Buffer;
    let originalBytes: number | null = null;
    let compositionMetadata: {
      referenceBytes: number;
      referenceHasAlpha: boolean;
      presentationMode:
        | "transparent_product"
        | "protected_photo_card"
        | "professional_real_photo";
      layout?: string;
    };

    try {
      if (realPhotoMode) {
        const selectedOffer = recordValue(brief.confirmed_offer);
        const frame = recordValue(brief.photo_framing);
        const price = Number(selectedOffer.price);
        if (selectedOffer.productName !== productResult.data.name ||
            !Number.isFinite(price) || price <= 0 ||
            !brandResult.data?.logo_url) {
          throw new Error("Oferta, preço ou logo não confirmados.");
        }
        const offer: ConfirmedPhotoOffer = {
          productName: productResult.data.name,
          kit: String(selectedOffer.kit ?? ""),
          price,
          delivery: selectedOffer.delivery === "free" ? "free" : "consult",
          freeDeliveryRegion: String(selectedOffer.freeDeliveryRegion ?? "")
        };
        // O plano só determina posição e cores. Nome, preço e condições são
        // sempre lidos do catálogo e da oferta aprovada, nunca da resposta da IA.
        const plan = recordValue(input.metadata.visual_plan);
        const allowedLayouts = ["hero_center", "hero_left", "hero_right"];
        const allowedInk = ["dark", "light"];
        const allowedAccent = ["yellow", "green"];
        if (!input.image_base64 ||
            !allowedLayouts.includes(String(plan.layout)) ||
            !allowedInk.includes(String(plan.ink)) ||
            !allowedAccent.includes(String(plan.accent))) {
          throw new Error("Fundo e direção visual aprovados são obrigatórios.");
        }
        const visualPlan: CreativeVisualPlan = {
          layout: plan.layout as CreativeVisualPlan["layout"],
          ink: plan.ink as CreativeVisualPlan["ink"],
          accent: plan.accent as CreativeVisualPlan["accent"]
        };
        const cutout = brief.cutout_polygon;
        if (Array.isArray(cutout)) {
          visualPlan.cutoutPolygon = cutout as [number, number][];
        }
        const generated = decodeImageBase64(input.image_base64);
        const composed = await composeProfessionalRealPhoto({
          referenceImageUrl: input.reference_image_url,
          logoUrl: brandResult.data.logo_url,
          width: target.width,
          height: target.height,
          offer,
          backgroundBuffer: generated,
          visualPlan,
          framing: { top: Number(frame.top), bottom: Number(frame.bottom) },
          direction: brief.art_direction === "editorial" ||
            brief.art_direction === "spotlight" ? brief.art_direction : "auto"
        });
        outputBuffer = composed.buffer;
        compositionMetadata = {
          referenceBytes: composed.referenceBytes,
          referenceHasAlpha: false,
          presentationMode: "professional_real_photo",
          layout: composed.layout
        };
        protectedContent.sale_price = price;
        protectedContent.confirmed_offer = offer;
      } else {
        if (!input.image_base64) throw new Error("Fundo visual ausente.");
        const sourceBuffer = decodeImageBase64(input.image_base64);
        originalBytes = sourceBuffer.length;
        const composed = await composeLockedCreative({
          backgroundBuffer: sourceBuffer,
          referenceImageUrl: input.reference_image_url,
          width: target.width,
          height: target.height,
          content: protectedContent
        });
        outputBuffer = composed.buffer;
        compositionMetadata = {
          referenceBytes: composed.referenceBytes,
          referenceHasAlpha: composed.referenceHasAlpha,
          presentationMode: composed.presentationMode
        };
      }
    } catch {
      throw domainError(
        "CREATIVE_IMAGE_INVALID",
        "O fundo ou a foto real do produto não pôde ser processado."
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
          p_content: protectedContent,
          p_storage_bucket: "creative-assets",
          p_storage_path: storagePath,
          p_public_url: publicUrl,
          p_mime_type: "image/webp",
          p_width: target.width,
          p_height: target.height,
          p_prompt: input.prompt,
          p_metadata: {
            ...input.metadata,
            source: realPhotoMode ? "professional-real-photo-v1" : "identity-lock-v3",
            background_source: realPhotoMode ? "code" : "gpt-image-2",
            original_bytes: originalBytes,
            reference_bytes:
              compositionMetadata.referenceBytes,
            reference_has_alpha:
              compositionMetadata.referenceHasAlpha,
            presentation_mode:
              compositionMetadata.presentationMode,
            layout: compositionMetadata.layout ?? null,
            selected_media_id: realPhotoMode ? brief.real_photo_media_id : null,
            photo_framing: realPhotoMode ? brief.photo_framing : null,
            identity_locked: true,
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
          provider: realPhotoMode ? "internal" : "openai",
          model: realPhotoMode ? "professional-real-photo-v1" : "identity-lock-v3",
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

