-- Central de Criativos IA - nucleo multiempresa
-- Fase 1: campanhas, canais, jobs, ativos, aprovacoes e perfil de marca.
-- A transacao garante rollback completo se qualquer etapa falhar.

begin;

create extension if not exists pgcrypto;

create table if not exists public.creative_brand_profiles (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete set null,
  brand_name text not null,
  voice_tone text,
  target_audience text,
  default_locale text not null default 'pt-BR',
  default_destination text not null default 'whatsapp'
    check (default_destination in ('whatsapp', 'site', 'platform')),
  whatsapp_number text,
  website_url text,
  logo_url text,
  brand_colors jsonb not null default '{}'::jsonb,
  commercial_rules jsonb not null default '{}'::jsonb,
  forbidden_claims text[] not null default '{}'::text[],
  platform_settings jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id)
);

create table if not exists public.creative_campaigns (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete set null,
  product_id uuid references public.products(id) on delete set null,
  title text not null,
  objective text not null default 'sales'
    check (objective in ('sales', 'messages', 'traffic', 'catalog', 'engagement')),
  primary_destination text not null default 'whatsapp'
    check (primary_destination in ('whatsapp', 'site', 'platform')),
  audience text,
  locale text not null default 'pt-BR',
  include_price boolean not null default true,
  status text not null default 'draft'
    check (status in ('draft', 'queued', 'generating', 'review', 'approved', 'failed', 'archived')),
  brief jsonb not null default '{}'::jsonb,
  created_by uuid not null,
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.creative_campaign_channels (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  campaign_id uuid not null references public.creative_campaigns(id) on delete cascade,
  platform text not null
    check (platform in ('meta', 'facebook_groups', 'marketplace', 'instagram', 'whatsapp', 'shopee', 'olx', 'tiktok', 'kwai')),
  formats text[] not null default '{}'::text[],
  status text not null default 'pending'
    check (status in ('pending', 'queued', 'generating', 'review', 'approved', 'failed')),
  configuration jsonb not null default '{}'::jsonb,
  copy_output jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campaign_id, platform)
);

create table if not exists public.creative_jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  campaign_id uuid not null references public.creative_campaigns(id) on delete cascade,
  channel_id uuid references public.creative_campaign_channels(id) on delete cascade,
  job_type text not null
    check (job_type in ('campaign_orchestration', 'strategy', 'copy', 'image', 'video', 'review', 'export')),
  status text not null default 'queued'
    check (status in ('queued', 'running', 'completed', 'failed', 'cancelled')),
  provider text,
  model text,
  external_job_id text,
  attempt_count integer not null default 0,
  input jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb,
  error_code text,
  error_message text,
  created_by uuid not null,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.creative_assets (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  campaign_id uuid not null references public.creative_campaigns(id) on delete cascade,
  channel_id uuid references public.creative_campaign_channels(id) on delete cascade,
  job_id uuid references public.creative_jobs(id) on delete set null,
  asset_type text not null
    check (asset_type in ('copy', 'image', 'video', 'audio', 'script', 'thumbnail', 'export')),
  status text not null default 'draft'
    check (status in ('draft', 'review', 'approved', 'rejected', 'failed')),
  version integer not null default 1 check (version > 0),
  title text,
  content jsonb not null default '{}'::jsonb,
  storage_bucket text,
  storage_path text,
  public_url text,
  mime_type text,
  width integer,
  height integer,
  duration_seconds numeric(10, 2),
  prompt text,
  metadata jsonb not null default '{}'::jsonb,
  approved_by uuid,
  approved_at timestamptz,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.creative_approvals (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  campaign_id uuid not null references public.creative_campaigns(id) on delete cascade,
  channel_id uuid references public.creative_campaign_channels(id) on delete cascade,
  asset_id uuid references public.creative_assets(id) on delete cascade,
  decision text not null check (decision in ('approved', 'changes_requested', 'rejected')),
  feedback text,
  decided_by uuid not null,
  decided_at timestamptz not null default now()
);

create index if not exists idx_creative_campaigns_company_created
  on public.creative_campaigns(company_id, created_at desc);
create index if not exists idx_creative_campaigns_company_status
  on public.creative_campaigns(company_id, status);
create index if not exists idx_creative_channels_campaign
  on public.creative_campaign_channels(campaign_id);
create index if not exists idx_creative_jobs_queue
  on public.creative_jobs(status, created_at)
  where status = 'queued';
create index if not exists idx_creative_assets_campaign
  on public.creative_assets(campaign_id, created_at desc);

create or replace function public.set_creative_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_creative_brand_profiles_updated_at on public.creative_brand_profiles;
create trigger trg_creative_brand_profiles_updated_at
before update on public.creative_brand_profiles
for each row execute function public.set_creative_updated_at();

drop trigger if exists trg_creative_campaigns_updated_at on public.creative_campaigns;
create trigger trg_creative_campaigns_updated_at
before update on public.creative_campaigns
for each row execute function public.set_creative_updated_at();

drop trigger if exists trg_creative_channels_updated_at on public.creative_campaign_channels;
create trigger trg_creative_channels_updated_at
before update on public.creative_campaign_channels
for each row execute function public.set_creative_updated_at();

drop trigger if exists trg_creative_jobs_updated_at on public.creative_jobs;
create trigger trg_creative_jobs_updated_at
before update on public.creative_jobs
for each row execute function public.set_creative_updated_at();

drop trigger if exists trg_creative_assets_updated_at on public.creative_assets;
create trigger trg_creative_assets_updated_at
before update on public.creative_assets
for each row execute function public.set_creative_updated_at();

alter table public.creative_brand_profiles enable row level security;
alter table public.creative_campaigns enable row level security;
alter table public.creative_campaign_channels enable row level security;
alter table public.creative_jobs enable row level security;
alter table public.creative_assets enable row level security;
alter table public.creative_approvals enable row level security;

comment on table public.creative_campaigns is
  'Campanhas multiempresa da Central de Criativos IA.';
comment on table public.creative_jobs is
  'Fila duravel para orquestracao pelo n8n e provedores de IA.';

commit;
