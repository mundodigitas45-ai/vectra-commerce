-- Central de Criativos IA - revisao humana atomica
-- Registra a decisao, atualiza a versao escolhida e recalcula canal/campanha.

begin;

create index if not exists idx_creative_approvals_campaign_decided
  on public.creative_approvals(company_id, campaign_id, decided_at desc);

create index if not exists idx_creative_assets_approved_channel
  on public.creative_assets(company_id, campaign_id, channel_id, asset_type)
  where status = 'approved';

create or replace function public.review_creative_asset(
  p_company_id uuid,
  p_campaign_id uuid,
  p_asset_id uuid,
  p_decision text,
  p_feedback text,
  p_decided_by uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_asset public.creative_assets%rowtype;
  v_approval_id uuid;
  v_campaign_status text;
  v_channel_status text;
begin
  if p_decision not in (
    'approved',
    'changes_requested',
    'rejected'
  ) then
    raise exception 'CREATIVE_REVIEW_INVALID: decisao invalida';
  end if;

  if p_decision = 'changes_requested'
     and nullif(btrim(coalesce(p_feedback, '')), '') is null then
    raise exception 'CREATIVE_REVIEW_INVALID: feedback obrigatorio';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(p_asset_id::text, 0)
  );

  select *
    into v_asset
    from public.creative_assets
   where id = p_asset_id
     and company_id = p_company_id
     and campaign_id = p_campaign_id
   for update;

  if not found then
    raise exception 'CREATIVE_ASSET_NOT_FOUND';
  end if;

  if v_asset.channel_id is null then
    raise exception 'CREATIVE_REVIEW_INVALID: asset sem canal';
  end if;

  insert into public.creative_approvals (
    company_id,
    campaign_id,
    channel_id,
    asset_id,
    decision,
    feedback,
    decided_by
  )
  values (
    p_company_id,
    p_campaign_id,
    v_asset.channel_id,
    p_asset_id,
    p_decision,
    nullif(btrim(coalesce(p_feedback, '')), ''),
    p_decided_by
  )
  returning id into v_approval_id;

  if p_decision = 'approved' then
    update public.creative_assets
       set status = 'review',
           approved_by = null,
           approved_at = null
     where company_id = p_company_id
       and campaign_id = p_campaign_id
       and channel_id = v_asset.channel_id
       and asset_type = v_asset.asset_type
       and id <> p_asset_id
       and status = 'approved';

    update public.creative_assets
       set status = 'approved',
           approved_by = p_decided_by,
           approved_at = now()
     where id = p_asset_id;

    v_channel_status := 'approved';
  else
    update public.creative_assets
       set status = 'rejected',
           approved_by = null,
           approved_at = null
     where id = p_asset_id;

    if exists (
      select 1
        from public.creative_assets
       where company_id = p_company_id
         and campaign_id = p_campaign_id
         and channel_id = v_asset.channel_id
         and asset_type = 'copy'
         and status = 'approved'
    ) then
      v_channel_status := 'approved';
    else
      v_channel_status := 'review';
    end if;
  end if;

  update public.creative_campaign_channels
     set status = v_channel_status
   where id = v_asset.channel_id
     and company_id = p_company_id
     and campaign_id = p_campaign_id;

  if not exists (
    select 1
      from public.creative_campaign_channels channel
     where channel.company_id = p_company_id
       and channel.campaign_id = p_campaign_id
       and not exists (
         select 1
           from public.creative_assets asset
          where asset.company_id = p_company_id
            and asset.campaign_id = p_campaign_id
            and asset.channel_id = channel.id
            and asset.asset_type = 'copy'
            and asset.status = 'approved'
       )
  ) then
    v_campaign_status := 'approved';

    update public.creative_campaigns
       set status = 'approved',
           approved_by = p_decided_by,
           approved_at = now()
     where id = p_campaign_id
       and company_id = p_company_id;
  else
    v_campaign_status := 'review';

    update public.creative_campaigns
       set status = 'review',
           approved_by = null,
           approved_at = null
     where id = p_campaign_id
       and company_id = p_company_id;
  end if;

  return jsonb_build_object(
    'approval_id', v_approval_id,
    'asset_id', p_asset_id,
    'channel_id', v_asset.channel_id,
    'decision', p_decision,
    'asset_status',
      case
        when p_decision = 'approved' then 'approved'
        else 'rejected'
      end,
    'channel_status', v_channel_status,
    'campaign_status', v_campaign_status
  );
end;
$$;

revoke all on function public.review_creative_asset(
  uuid,
  uuid,
  uuid,
  text,
  text,
  uuid
) from public, anon, authenticated;

grant execute on function public.review_creative_asset(
  uuid,
  uuid,
  uuid,
  text,
  text,
  uuid
) to service_role;

commit;
