-- Central de Criativos IA - fundacao para imagens por formato.
-- Cria armazenamento dedicado, versionamento atomico e leasing isolado do worker visual.

begin;

alter table public.creative_assets
  add column if not exists format_key text;

update public.creative_assets
   set format_key = 'square'
 where asset_type = 'image'
   and format_key is null;

alter table public.creative_assets
  drop constraint if exists creative_assets_format_key_check;

alter table public.creative_assets
  add constraint creative_assets_format_key_check
  check (
    (
      asset_type = 'image'
      and format_key in (
        'square',
        'feed_portrait',
        'story',
        'landscape'
      )
    )
    or (
      asset_type <> 'image'
      and format_key is null
    )
  );

drop index if exists public.uq_creative_assets_version;

create unique index uq_creative_assets_version
  on public.creative_assets (
    company_id,
    campaign_id,
    channel_id,
    asset_type,
    coalesce(format_key, 'default'),
    version
  );

create index if not exists idx_creative_assets_image_review
  on public.creative_assets (
    company_id,
    campaign_id,
    channel_id,
    format_key,
    status,
    version desc
  )
  where asset_type = 'image';

create index if not exists idx_creative_image_jobs_lease
  on public.creative_jobs (
    status,
    lease_expires_at,
    created_at
  )
  where job_type = 'image'
    and status in ('queued', 'running');

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'creative-assets',
  'creative-assets',
  true,
  15728640,
  array[
    'image/png',
    'image/jpeg',
    'image/webp'
  ]::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.claim_next_creative_image_job(
  p_worker_id text,
  p_lease_seconds integer default 600
)
returns setof public.creative_jobs
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_job public.creative_jobs%rowtype;
  safe_lease_seconds integer;
begin
  if nullif(trim(p_worker_id), '') is null then
    raise exception 'WORKER_ID_REQUIRED';
  end if;

  safe_lease_seconds :=
    greatest(120, least(coalesce(p_lease_seconds, 600), 1800));

  select job.*
    into selected_job
    from public.creative_jobs job
   where job.job_type = 'image'
     and (
       job.status = 'queued'
       or (
         job.status = 'running'
         and job.lease_expires_at is not null
         and job.lease_expires_at < now()
       )
     )
   order by job.created_at asc
   for update skip locked
   limit 1;

  if not found then
    return;
  end if;

  update public.creative_jobs
     set status = 'running',
         locked_by = trim(p_worker_id),
         locked_at = now(),
         lease_expires_at =
           now() + make_interval(secs => safe_lease_seconds),
         attempt_count = attempt_count + 1,
         started_at = coalesce(started_at, now()),
         completed_at = null,
         error_code = null,
         error_message = null
   where id = selected_job.id
   returning * into selected_job;

  return next selected_job;
end;
$$;

create or replace function public.insert_creative_image_asset_version(
  p_company_id uuid,
  p_campaign_id uuid,
  p_channel_id uuid,
  p_job_id uuid,
  p_format_key text,
  p_content jsonb,
  p_storage_bucket text,
  p_storage_path text,
  p_public_url text,
  p_mime_type text,
  p_width integer,
  p_height integer,
  p_prompt text,
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
  v_format_key text;
  v_version integer;
  v_asset_id uuid;
begin
  v_format_key := nullif(btrim(p_format_key), '');

  if v_format_key not in (
    'square',
    'feed_portrait',
    'story',
    'landscape'
  ) then
    raise exception using
      errcode = 'P0001',
      message = 'CREATIVE_IMAGE_FORMAT_INVALID';
  end if;

  if p_storage_bucket <> 'creative-assets' then
    raise exception using
      errcode = 'P0001',
      message = 'CREATIVE_IMAGE_BUCKET_INVALID';
  end if;

  if nullif(btrim(coalesce(p_storage_path, '')), '') is null
     or nullif(btrim(coalesce(p_public_url, '')), '') is null then
    raise exception using
      errcode = 'P0001',
      message = 'CREATIVE_IMAGE_STORAGE_REQUIRED';
  end if;

  if p_mime_type not in (
    'image/png',
    'image/jpeg',
    'image/webp'
  ) then
    raise exception using
      errcode = 'P0001',
      message = 'CREATIVE_IMAGE_MIME_INVALID';
  end if;

  if coalesce(p_width, 0) <= 0
     or coalesce(p_height, 0) <= 0 then
    raise exception using
      errcode = 'P0001',
      message = 'CREATIVE_IMAGE_DIMENSIONS_INVALID';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(
      concat_ws(
        ':',
        p_company_id::text,
        p_campaign_id::text,
        p_channel_id::text,
        'image',
        v_format_key
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

  if not exists (
    select 1
      from public.creative_jobs job
     where job.id = p_job_id
       and job.company_id = p_company_id
       and job.campaign_id = p_campaign_id
       and job.job_type = 'image'
  ) then
    raise exception using
      errcode = 'P0001',
      message = 'CREATIVE_IMAGE_JOB_NOT_FOUND';
  end if;

  select coalesce(max(asset.version), 0) + 1
    into v_version
    from public.creative_assets asset
   where asset.company_id = p_company_id
     and asset.campaign_id = p_campaign_id
     and asset.channel_id = p_channel_id
     and asset.asset_type = 'image'
     and asset.format_key = v_format_key;

  insert into public.creative_assets (
    company_id,
    campaign_id,
    channel_id,
    job_id,
    asset_type,
    format_key,
    status,
    version,
    content,
    storage_bucket,
    storage_path,
    public_url,
    mime_type,
    width,
    height,
    prompt,
    metadata,
    created_by
  )
  values (
    p_company_id,
    p_campaign_id,
    p_channel_id,
    p_job_id,
    'image',
    v_format_key,
    'review',
    v_version,
    coalesce(p_content, '{}'::jsonb),
    p_storage_bucket,
    p_storage_path,
    p_public_url,
    p_mime_type,
    p_width,
    p_height,
    nullif(btrim(coalesce(p_prompt, '')), ''),
    coalesce(p_metadata, '{}'::jsonb),
    p_created_by
  )
  returning id into v_asset_id;

  return query
  select v_asset_id, v_version;
end;
$$;

revoke all on function public.claim_next_creative_image_job(
  text,
  integer
) from public, anon, authenticated;

grant execute on function public.claim_next_creative_image_job(
  text,
  integer
) to service_role;

revoke all on function public.insert_creative_image_asset_version(
  uuid,
  uuid,
  uuid,
  uuid,
  text,
  jsonb,
  text,
  text,
  text,
  text,
  integer,
  integer,
  text,
  jsonb,
  uuid
) from public, anon, authenticated;

grant execute on function public.insert_creative_image_asset_version(
  uuid,
  uuid,
  uuid,
  uuid,
  text,
  jsonb,
  text,
  text,
  text,
  text,
  integer,
  integer,
  text,
  jsonb,
  uuid
) to service_role;

commit;
