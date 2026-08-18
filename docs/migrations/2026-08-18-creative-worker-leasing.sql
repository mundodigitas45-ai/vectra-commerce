-- Central de Criativos IA - leasing atomico para executores n8n.
-- Fase 2: reivindicacao segura e recuperacao de jobs abandonados.

begin;

alter table public.creative_jobs
  add column if not exists locked_by text,
  add column if not exists locked_at timestamptz,
  add column if not exists lease_expires_at timestamptz;

create index if not exists idx_creative_jobs_lease
  on public.creative_jobs(status, lease_expires_at, created_at)
  where status in ('queued', 'running');

create or replace function public.claim_next_creative_job(
  p_worker_id text,
  p_lease_seconds integer default 300
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
    greatest(60, least(coalesce(p_lease_seconds, 300), 1800));

  select job.*
    into selected_job
    from public.creative_jobs job
   where job.job_type = 'campaign_orchestration'
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

  update public.creative_campaigns
     set status = 'generating'
   where id = selected_job.campaign_id
     and company_id = selected_job.company_id;

  return next selected_job;
end;
$$;

revoke all on function public.claim_next_creative_job(text, integer)
  from public, anon, authenticated;

grant execute on function public.claim_next_creative_job(text, integer)
  to service_role;

commit;
