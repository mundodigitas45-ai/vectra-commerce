import { supabase } from "../../config/supabase";
import type {
  ClaimCreativeJobInput,
  CompleteCreativeJobInput,
  FailCreativeJobInput
} from "./creative-worker.schemas";

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

export class CreativeWorkerRepository {
  async claim(input: ClaimCreativeJobInput) {
    const { data, error } = await supabase.rpc(
      "claim_next_creative_job",
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

    const { data: campaign, error: campaignError } =
      await supabase
        .from("creative_campaigns")
        .select(
          "id, company_id, workspace_id, product_id, title, objective, primary_destination, audience, locale, include_price, status, brief, creative_campaign_channels(id, platform, formats, configuration)"
        )
        .eq("id", job.campaign_id)
        .eq("company_id", job.company_id)
        .single();

    if (campaignError) {
      throw repositoryError(campaignError);
    }

    let product = null;

    if (campaign.product_id) {
      const { data: productData, error: productError } =
        await supabase
          .from("products")
          .select(
            "id, company_id, name, slug, description, sale_price, cost_price, is_active"
          )
          .eq("id", campaign.product_id)
          .eq("company_id", campaign.company_id)
          .maybeSingle();

      if (productError) {
        throw repositoryError(productError);
      }

      product = productData;
    }

    const { data: brandProfile, error: brandError } =
      await supabase
        .from("creative_brand_profiles")
        .select("*")
        .eq("company_id", campaign.company_id)
        .maybeSingle();

    if (brandError) {
      throw repositoryError(brandError);
    }

    return {
      job,
      campaign,
      product,
      brand_profile: brandProfile
    };
  }

  private async activeJob(
    jobId: string,
    workerId: string
  ) {
    const { data, error } = await supabase
      .from("creative_jobs")
      .select(
        "id, company_id, campaign_id, status, locked_by, created_by"
      )
      .eq("id", jobId)
      .eq("status", "running")
      .eq("locked_by", workerId)
      .maybeSingle();

    if (error) throw repositoryError(error);

    if (!data) {
      throw domainError(
        "CREATIVE_JOB_LEASE_INVALID",
        "O job não está ativo para este executor."
      );
    }

    return data;
  }

  async complete(
    jobId: string,
    input: CompleteCreativeJobInput
  ) {
    const job = await this.activeJob(
      jobId,
      input.worker_id
    );

    for (const channelOutput of input.channels) {
      const { data: channel, error: channelError } =
        await supabase
          .from("creative_campaign_channels")
          .update({
            copy_output: channelOutput.copy,
            status: "review"
          })
          .eq("id", channelOutput.channel_id)
          .eq("campaign_id", job.campaign_id)
          .eq("company_id", job.company_id)
          .select("id")
          .maybeSingle();

      if (channelError) {
        throw repositoryError(channelError);
      }

      if (!channel) {
        throw domainError(
          "CREATIVE_CHANNEL_NOT_FOUND",
          "Um dos canais não pertence ao job informado."
        );
      }

      const { error: assetError } = await supabase
        .from("creative_assets")
        .insert({
          company_id: job.company_id,
          campaign_id: job.campaign_id,
          channel_id: channelOutput.channel_id,
          job_id: job.id,
          asset_type: "copy",
          status: "review",
          version: 1,
          content: channelOutput.copy,
          metadata: {
            source: "creative_worker"
          },
          created_by: job.created_by
        });

      if (assetError) {
        throw repositoryError(assetError);
      }
    }

    const { data: completedJob, error: jobError } =
      await supabase
        .from("creative_jobs")
        .update({
          status: "completed",
          output: input.output,
          completed_at: new Date().toISOString(),
          lease_expires_at: null
        })
        .eq("id", job.id)
        .eq("status", "running")
        .eq("locked_by", input.worker_id)
        .select(
          "id, campaign_id, status, output, completed_at"
        )
        .single();

    if (jobError) throw repositoryError(jobError);

    const { error: campaignError } = await supabase
      .from("creative_campaigns")
      .update({ status: "review" })
      .eq("id", job.campaign_id)
      .eq("company_id", job.company_id);

    if (campaignError) {
      throw repositoryError(campaignError);
    }

    return completedJob;
  }

  async fail(
    jobId: string,
    input: FailCreativeJobInput
  ) {
    const job = await this.activeJob(
      jobId,
      input.worker_id
    );

    const { data: failedJob, error: jobError } =
      await supabase
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
          "id, campaign_id, status, error_code, error_message, completed_at"
        )
        .single();

    if (jobError) throw repositoryError(jobError);

    const { error: campaignError } = await supabase
      .from("creative_campaigns")
      .update({ status: "failed" })
      .eq("id", job.campaign_id)
      .eq("company_id", job.company_id);

    if (campaignError) {
      throw repositoryError(campaignError);
    }

    return failedJob;
  }
}

export const creativeWorkerRepository =
  new CreativeWorkerRepository();
