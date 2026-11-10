import type { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { supabase } from "../../config/supabase";
import {
  composeProfessionalRealPhoto
} from "./professional-real-photo-compositor";
import { requireSelectedRealPhoto } from "./real-photo-identity";

const MIRANDA_COMPANY_ID = "e2e1f5bc-3f6c-4868-9d9c-5c8226df9b3d";

export const realPhotoPreviewSchema = z.object({
  product_id: z.string().uuid(),
  media_id: z.string().uuid(),
  format_key: z.enum(["square", "feed_portrait", "story", "landscape"]),
  offer: z.object({
    productName: z.string().trim().min(2).max(220),
    kit: z.string().trim().min(2).max(180),
    price: z.number().positive().max(100_000),
    delivery: z.enum(["consult", "free"]),
    freeDeliveryRegion: z.string().max(100)
  }),
  framing: z.object({
    top: z.number().min(0).max(0.4),
    bottom: z.number().min(0.6).max(1)
  }),
  direction: z.enum(["auto", "editorial", "spotlight"])
}).refine(data => data.framing.top < data.framing.bottom &&
    (data.offer.delivery !== "free" || !!data.offer.freeDeliveryRegion.trim()), {
  message: "Confira enquadramento e região da entrega grátis."
});

export type PreviewInput = z.infer<typeof realPhotoPreviewSchema>;

const targets: Record<PreviewInput["format_key"], { width: number; height: number }> = {
  square: { width: 1080, height: 1080 },
  feed_portrait: { width: 1080, height: 1350 },
  story: { width: 1080, height: 1920 },
  landscape: { width: 1200, height: 628 }
};

function fail(reply: FastifyReply, status: number, code: string, message: string) {
  return reply.status(status).send({ success: false, error: { code, message } });
}

export async function previewProfessionalRealPhoto(
  request: FastifyRequest<{ Body: PreviewInput }>,
  reply: FastifyReply
) {
  const context = request.authContext;
  if (!context) return fail(reply, 500, "COMPANY_CONTEXT_MISSING", "Empresa ativa não identificada.");
  if (context.companyId !== MIRANDA_COMPANY_ID) {
    return fail(reply, 403, "CREATIVE_BRAND_UNAVAILABLE",
      "Este modelo comercial ainda não foi configurado para esta empresa.");
  }
  if (context.role === "viewer") {
    return fail(reply, 403, "CREATIVE_MANAGE_FORBIDDEN",
      "Seu usuário não possui permissão para gerar criativos.");
  }
  const parsed = realPhotoPreviewSchema.safeParse(request.body);
  if (!parsed.success) {
    return fail(reply, 400, "CREATIVE_PREVIEW_INVALID", "Confira foto, produto e oferta.");
  }
  const input = parsed.data;
  const [product, media, brand] = await Promise.all([
    supabase.from("products").select("id, name")
      .eq("id", input.product_id).eq("company_id", context.companyId)
      .eq("is_active", true).maybeSingle(),
    supabase.from("product_media").select("id, public_url, source, file_name, mime_type")
      .eq("id", input.media_id).eq("product_id", input.product_id)
      .eq("company_id", context.companyId)
      .eq("media_type", "image").eq("is_active", true).maybeSingle(),
    supabase.from("creative_brand_profiles").select("logo_url")
      .eq("company_id", context.companyId).maybeSingle()
  ]);
  if (product.error || media.error || brand.error) {
    request.log.error({ product: product.error?.code, media: media.error?.code,
      brand: brand.error?.code }, "Falha de consulta da prévia real");
    return fail(reply, 502, "CREATIVE_PREVIEW_LOOKUP_FAILED",
      "Não foi possível carregar produto, foto e logo.");
  }
  if (!product.data || !media.data || !brand.data?.logo_url ||
      input.offer.productName !== product.data.name) {
    return fail(reply, 422, "CREATIVE_PREVIEW_DATA_CHANGED",
      "Produto, foto ou logo mudaram. Atualize a página e confirme novamente.");
  }
  try {
    requireSelectedRealPhoto(media.data, input.media_id);
    const result = await composeProfessionalRealPhoto({
      referenceImageUrl: media.data.public_url,
      logoUrl: brand.data.logo_url,
      ...targets[input.format_key],
      offer: input.offer,
      framing: input.framing,
      direction: input.direction
    });
    return reply.send({
      success: true,
      data: {
        image_data_url: `data:image/webp;base64,${result.buffer.toString("base64")}`,
        media_id: input.media_id,
        width: targets[input.format_key].width,
        height: targets[input.format_key].height,
        layout: result.layout
      }
    });
  } catch (error) {
    request.log.warn({ message: error instanceof Error ? error.message : "unknown" },
      "Prévia de foto real recusada");
    return fail(reply, 422, "CREATIVE_PREVIEW_FAILED",
      "A foto ou a logo não pôde ser composta. Confira os arquivos originais.");
  }
}
