import { z } from "zod";

export const claimCreativeJobSchema = z.object({
  worker_id: z.string().trim().min(3).max(120),
  lease_seconds: z.number().int().min(60).max(1800).default(300)
});

export const completeCreativeJobSchema = z.object({
  worker_id: z.string().trim().min(3).max(120),
  output: z.record(z.unknown()).default({}),
  channels: z.array(
    z.object({
      channel_id: z.string().uuid(),
      copy: z.record(z.unknown())
    })
  ).min(1).max(9)
});

export const failCreativeJobSchema = z.object({
  worker_id: z.string().trim().min(3).max(120),
  error_code: z.string().trim().min(2).max(120),
  error_message: z.string().trim().min(2).max(2000),
  output: z.record(z.unknown()).default({})
});

export type ClaimCreativeJobInput =
  z.infer<typeof claimCreativeJobSchema>;

export type CompleteCreativeJobInput =
  z.infer<typeof completeCreativeJobSchema>;

export type FailCreativeJobInput =
  z.infer<typeof failCreativeJobSchema>;
