import { z } from "zod";

export const analyticsEventNames = [
  "heartbeat",
  "page_view",
  "view_product",
  "click_whatsapp",
  "initiate_checkout",
  "purchase"
] as const;

const optionalText = (maximum: number) =>
  z.string().trim().max(maximum).optional().nullable();

export const publicAnalyticsEventSchema = z.object({
  domain: z.string().trim().min(3).max(253),
  visitor_id: z.string().uuid(),
  session_id: z.string().uuid(),
  event_name: z.enum(analyticsEventNames),
  page_path: z.string().trim().min(1).max(500),
  page_title: optionalText(200),
  product_id: z.string().uuid().optional().nullable(),
  product_name: optionalText(200),
  referrer_domain: optionalText(253),
  utm_source: optionalText(120),
  utm_medium: optionalText(120),
  utm_campaign: optionalText(160)
}).strict();

export const analyticsSummaryQuerySchema = z.object({
  site_id: z.string().uuid(),
  days: z.coerce.number().int().min(7).max(30).default(7)
});

export type PublicAnalyticsEventInput =
  z.infer<typeof publicAnalyticsEventSchema>;

export type AnalyticsSummaryQuery =
  z.infer<typeof analyticsSummaryQuerySchema>;
