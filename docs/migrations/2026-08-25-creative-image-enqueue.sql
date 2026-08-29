-- Central de Criativos IA
-- Define formatos por plataforma e cria jobs após aprovação da copy.

begin;

create or replace function public.creative_formats_for_platform(
  p_platform text
)
returns text[]
language sql
immutable
set search_path = public
as $$
  select case lower(coalesce(p_platform, ''))
    when 'meta' then
      array[
        'square',
        'feed_portrait',
        'story',
        'landscape'
      ]::text[]
    when 'instagram' then
      array[
        'square',
        'feed_portrait',
        'story'
      ]::text[]
    when 'facebook_groups' then
      array[
        'square',
        'landscape'
      ]::text[]
    when 'marketplace' then
      array['square']::text[]
    when 'whatsapp' then
      array[
        'square',
        'story'
      ]::text[]
    when 'shopee' then
      array['square']::text[]
    when 'olx' then
      array[
        'square',
        'landscape'
      ]::text[]
    when 'tiktok' then
      array['story']::text[]
    when 'kwai' then
      array['story']::text[]
    else
      array['square']::text[]
  end;
$$;

update public.creative_campaign_channels
   set formats =
     public.creative_formats_for_platform(platform)
 where formats is null
    or cardinality(formats) = 0;

create or replace function
  public.enqueue_creative_images_after_copy_approval()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_formats text[];
  v_format text;
begin
  if new.asset_type <> 'copy'
     or new.status <> 'approved'
     or old.status is not distinct from new.status then
    return new;
  end if;

  select
    case
      when channel.formats is null
        or cardinality(channel.formats) = 0
      then public.creative_formats_for_platform(
        channel.platform
      )
      else channel.formats
    end
    into v_formats
    from public.creative_campaign_channels channel
   where channel.id = new.channel_id
     and channel.company_id = new.company_id
     and channel.campaign_id = new.campaign_id;

  if not found then
    raise exception using
      errcode = 'P0001',
      message = 'CREATIVE_CHANNEL_NOT_FOUND';
  end if;

  update public.creative_campaign_channels
     set formats = v_formats
   where id = new.channel_id
     and (
       formats is null
       or cardinality(formats) = 0
     );

  foreach v_format in array v_formats
  loop
    if v_format not in (
      'square',
      'feed_portrait',
      'story',
      'landscape'
    ) then
      raise exception using
        errcode = 'P0001',
        message = 'CREATIVE_IMAGE_FORMAT_INVALID';
    end if;

    insert into public.creative_jobs (
      company_id,
      campaign_id,
      channel_id,
      job_type,
      status,
      input,
      output,
      created_by
    )
    select
      new.company_id,
      new.campaign_id,
      new.channel_id,
      'image',
      'queued',
      jsonb_build_object(
        'requested_outputs',
          jsonb_build_array('image'),
        'format_key',
          v_format,
        'source_copy_asset_id',
          new.id,
        'source_copy_version',
          new.version,
        'approved_at',
          new.approved_at
      ),
      '{}'::jsonb,
      coalesce(new.approved_by, new.created_by)
    where not exists (
      select 1
        from public.creative_jobs job
       where job.company_id = new.company_id
         and job.campaign_id = new.campaign_id
         and job.channel_id = new.channel_id
         and job.job_type = 'image'
         and job.input ->> 'format_key' = v_format
         and job.input ->> 'source_copy_asset_id' =
           new.id::text
         and job.status in (
           'queued',
           'running',
           'completed'
         )
    );
  end loop;

  return new;
end;
$$;

drop trigger if exists
  trg_enqueue_creative_images_after_copy_approval
  on public.creative_assets;

create trigger
  trg_enqueue_creative_images_after_copy_approval
after update of status
on public.creative_assets
for each row
when (
  new.asset_type = 'copy'
  and new.status = 'approved'
  and old.status is distinct from new.status
)
execute function
  public.enqueue_creative_images_after_copy_approval();

commit;
