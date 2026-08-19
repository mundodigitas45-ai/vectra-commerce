-- Versionamento atomico dos assets da Central de Criativos.
-- Cada nova geracao preserva as anteriores como versoes 1, 2, 3...
begin;

create unique index if not exists uq_creative_assets_version
  on public.creative_assets (
    company_id,
    campaign_id,
    channel_id,
    asset_type,
    version
  );

create or replace function public.insert_creative_copy_asset_version(
  p_company_id uuid,
  p_campaign_id uuid,
  p_channel_id uuid,
  p_job_id uuid,
  p_content jsonb,
  p_metadata jsonb,
  p_created_by uuid
)
returns table (
  asset_id uuid,
  asset_version integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_version integer;
  v_asset_id uuid;
begin
  perform pg_advisory_xact_lock(
    hashtextextended(
      concat_ws(
        ':',
        p_company_id::text,
        p_campaign_id::text,
        p_channel_id::text,
        'copy'
      ),
      0
    )
  );

  if not exists (
    select 1
    from public.creative_campaign_channels channel
    where channel.id = p_channel_id
      and channel.campaign_id = p_campaign_id
      and channel.company_id = p_company_id
  ) then
    raise exception using
      errcode = 'P0001',
      message = 'CREATIVE_CHANNEL_NOT_FOUND';
  end if;

  select coalesce(max(asset.version), 0) + 1
    into v_version
  from public.creative_assets asset
  where asset.company_id = p_company_id
    and asset.campaign_id = p_campaign_id
    and asset.channel_id = p_channel_id
    and asset.asset_type = 'copy';

  insert into public.creative_assets (
    company_id,
    campaign_id,
    channel_id,
    job_id,
    asset_type,
    status,
    version,
    content,
    metadata,
    created_by
  )
  values (
    p_company_id,
    p_campaign_id,
    p_channel_id,
    p_job_id,
    'copy',
    'review',
    v_version,
    coalesce(p_content, '{}'::jsonb),
    coalesce(p_metadata, '{}'::jsonb),
    p_created_by
  )
  returning id into v_asset_id;

  return query
  select v_asset_id, v_version;
end;
$$;

revoke all on function public.insert_creative_copy_asset_version(
  uuid,
  uuid,
  uuid,
  uuid,
  jsonb,
  jsonb,
  uuid
) from public, anon, authenticated;

grant execute on function public.insert_creative_copy_asset_version(
  uuid,
  uuid,
  uuid,
  uuid,
  jsonb,
  jsonb,
  uuid
) to service_role;

commit;
