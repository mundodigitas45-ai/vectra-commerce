import { z } from "zod";

export const creativeImageFormatSchema = z.enum([
  "square",
  "feed_portrait",
  "story",
  "landscape"
]);

export const claimCreativeImageJobSchema = z.object({
  worker_id: z.string().trim().min(3).max(120),
  lease_seconds: z.number().int().min(120).max(1800).default(900)
});

export const completeCreativeImageJobSchema = z.object({
  worker_id: z.string().trim().min(3).max(120),
  channel_id: z.string().uuid(),
  format_key: creativeImageFormatSchema,
  image_base64: z.string().min(100).max(25_000_000),
  prompt: z.string().trim().min(2).max(32_000),
  content: z.record(z.unknown()).default({}),
  metadata: z.record(z.unknown()).default({}),
  output: z.record(z.unknown()).default({})
});

export const failCreativeImageJobSchema = z.object({
  worker_id: z.string().trim().min(3).max(120),
  error_code: z.string().trim().min(2).max(120),
  error_message: z.string().trim().min(2).max(2000),
  output: z.record(z.unknown()).default({})
});

export type CreativeImageFormat =
  z.infer<typeof creativeImageFormatSchema>;

export type ClaimCreativeImageJobInput =
  z.infer<typeof claimCreativeImageJobSchema>;

export type CompleteCreativeImageJobInput =
  z.infer<typeof completeCreativeImageJobSchema>;

export type FailCreativeImageJobInput =
  z.infer<typeof failCreativeImageJobSchema>;
