import { supabase } from "../../config/supabase";
import type {
  CreateCreativeCampaignInput,
  RequestCreativeGenerationInput,
  ReviewCreativeAssetInput
} from "./creative-campaign.schemas";

const campaignSelection =
  "id, company_id, workspace_id, product_id, title, objective, primary_destination, audience, locale, include_price, status, brief, created_by, approved_by, approved_at, created_at, updated_at, creative_campaign_channels(id, platform, formats, status, configuration, copy_output, created_at, updated_at)";

function wrappedError(
  error: { message: string; code?: string }
): Error & { code?: string } {
  const result = new Error(error.message) as Error & {
    code?: string;
  };

  result.code = error.code;
  return result;
}

export class CreativeCampaignRepository {
  async list(companyId: string) {
    const { data, error } = await supabase
      .from("creative_campaigns")
      .select(campaignSelection)
      .eq("company_id", companyId)
      .order("created_at", {
        ascending: false
      });

    if (error) throw wrappedError(error);
    return data ?? [];
  }

  async getById(
    companyId: string,
    campaignId: string
  ) {
    const { data, error } = await supabase
      .from("creative_campaigns")
      .select(campaignSelection)
      .eq("company_id", companyId)
      .eq("id", campaignId)
      .maybeSingle();

    if (error) throw wrappedError(error);
    return data;
  }

  async getReview(
    companyId: string,
    campaignId: string
  ) {
    const campaign = await this.getById(
      companyId,
      campaignId
    );

    if (!campaign) return null;

    const [assetsResult, approvalsResult, jobsResult] =
      await Promise.all([
        supabase
          .from("creative_assets")
          .select(
            "id, campaign_id, channel_id, job_id, asset_type, status, version, title, content, metadata, approved_by, approved_at, created_at, updated_at"
          )
          .eq("company_id", companyId)
          .eq("campaign_id", campaignId)
          .order("channel_id", { ascending: true })
          .order("version", { ascending: false }),
        supabase
          .from("creative_approvals")
          .select(
            "id, campaign_id, channel_id, asset_id, decision, feedback, decided_by, decided_at"
          )
          .eq("company_id", companyId)
          .eq("campaign_id", campaignId)
          .order("decided_at", { ascending: false }),
        supabase
          .from("creative_jobs")
          .select(
            "id, status, output, error_code, error_message, created_at, completed_at"
          )
          .eq("company_id", companyId)
          .eq("campaign_id", campaignId)
          .order("created_at", { ascending: false })
      ]);

    if (assetsResult.error) {
      throw wrappedError(assetsResult.error);
    }

    if (approvalsResult.error) {
      throw wrappedError(approvalsResult.error);
    }

    if (jobsResult.error) {
      throw wrappedError(jobsResult.error);
    }

    return {
      campaign,
      assets: assetsResult.data ?? [],
      approvals: approvalsResult.data ?? [],
      jobs: jobsResult.data ?? []
    };
  }

  private async ensureProductAccess(
    companyId: string,
    productId: string | null | undefined
  ) {
    if (!productId) return;

    const { data, error } = await supabase
      .from("products")
      .select("id")
      .eq("company_id", companyId)
      .eq("id", productId)
      .maybeSingle();

    if (error) throw wrappedError(error);

    if (!data) {
      const accessError = new Error(
        "O produto informado não pertence à empresa ativa."
      ) as Error & { code?: string };

      accessError.code = "PRODUCT_ACCESS_DENIED";
      throw accessError;
    }
  }

  async create(
    companyId: string,
    userId: string,
    input: CreateCreativeCampaignInput
  ) {
    await this.ensureProductAccess(
      companyId,
      input.product_id
    );

    const { data: campaign, error: campaignError } =
      await supabase
        .from("creative_campaigns")
        .insert({
          company_id: companyId,
          workspace_id: input.workspace_id ?? null,
          product_id: input.product_id ?? null,
          title: input.title,
          objective: input.objective,
          primary_destination:
            input.primary_destination,
          audience: input.audience ?? null,
          locale: input.locale,
          include_price: input.include_price,
          status: "draft",
          brief: input.brief,
          created_by: userId
        })
        .select("id")
        .single();

    if (campaignError) {
      throw wrappedError(campaignError);
    }

    const channels = input.platforms.map(
      (platform) => ({
        company_id: companyId,
        campaign_id: campaign.id,
        platform,
        formats: [],
        status: "pending",
        configuration: {},
        copy_output: {}
      })
    );

    const { error: channelsError } = await supabase
      .from("creative_campaign_channels")
      .insert(channels);

    if (channelsError) {
      await supabase
        .from("creative_campaigns")
        .delete()
        .eq("id", campaign.id)
        .eq("company_id", companyId);

      throw wrappedError(channelsError);
    }

    return this.getById(
      companyId,
      campaign.id
    );
  }

  async enqueueGeneration(
    companyId: string,
    userId: string,
    campaignId: string,
    input: RequestCreativeGenerationInput
  ) {
    const campaign = await this.getById(
      companyId,
      campaignId
    );

    if (!campaign) {
      const notFound = new Error(
        "Campanha não encontrada."
      ) as Error & { code?: string };

      notFound.code = "CAMPAIGN_NOT_FOUND";
      throw notFound;
    }

    if (!input.force_new) {
      const { data: existing, error: existingError } =
        await supabase
          .from("creative_jobs")
          .select(
            "id, campaign_id, job_type, status, input, output, created_at, updated_at"
          )
          .eq("company_id", companyId)
          .eq("campaign_id", campaignId)
          .eq("job_type", "campaign_orchestration")
          .in("status", ["queued", "running"])
          .order("created_at", {
            ascending: false
          })
          .limit(1)
          .maybeSingle();

      if (existingError) {
        throw wrappedError(existingError);
      }

      if (existing) {
        return {
          job: existing,
          reused: true
        };
      }
    }

    const { data: job, error: jobError } =
      await supabase
        .from("creative_jobs")
        .insert({
          company_id: companyId,
          campaign_id: campaignId,
          channel_id: null,
          job_type: "campaign_orchestration",
          status: "queued",
          input: {
            requested_outputs:
              input.requested_outputs,
            campaign_snapshot: campaign
          },
          output: {},
          created_by: userId
        })
        .select(
          "id, campaign_id, job_type, status, input, output, created_at, updated_at"
        )
        .single();

    if (jobError) throw wrappedError(jobError);

    const { error: campaignUpdateError } =
      await supabase
        .from("creative_campaigns")
        .update({
          status: "queued"
        })
        .eq("company_id", companyId)
        .eq("id", campaignId);

    if (campaignUpdateError) {
      throw wrappedError(campaignUpdateError);
    }

    return {
      job,
      reused: false
    };
  }

  async reviewAsset(
    companyId: string,
    userId: string,
    campaignId: string,
    assetId: string,
    input: ReviewCreativeAssetInput
  ) {
    const { data, error } = await supabase.rpc(
      "review_creative_asset",
      {
        p_company_id: companyId,
        p_campaign_id: campaignId,
        p_asset_id: assetId,
        p_decision: input.decision,
        p_feedback: input.feedback ?? null,
        p_decided_by: userId
      }
    );

    if (error) throw wrappedError(error);
    return data;
  }
}

export const creativeCampaignRepository =
  new CreativeCampaignRepository();
