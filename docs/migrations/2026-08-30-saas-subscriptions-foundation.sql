-- Vectra Commerce SaaS
-- Fundação de planos, assinaturas, módulos e onboarding.
-- Não cadastra preços nem bloqueia o fluxo antigo.

begin;

create extension if not exists pgcrypto;

create or replace function public.set_saas_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create table if not exists public.saas_plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  status text not null default 'draft'
    check (status in ('draft', 'active', 'archived')),
  billing_interval text not null default 'monthly'
    check (billing_interval in ('monthly', 'yearly', 'one_time')),
  price_amount numeric(14, 2),
  currency char(3) not null default 'BRL',
  trial_days integer not null default 0
    check (trial_days between 0 and 365),
  sort_order integer not null default 0,
  is_public boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (price_amount is null or price_amount >= 0)
);

create table if not exists public.saas_plan_features (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null
    references public.saas_plans(id) on delete cascade,
  feature_key text not null,
  feature_name text not null,
  is_enabled boolean not null default true,
  is_public boolean not null default true,
  limit_value bigint,
  configuration jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (plan_id, feature_key),
  check (limit_value is null or limit_value >= 0)
);

create table if not exists public.company_subscriptions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null
    references public.companies(id) on delete cascade,
  plan_id uuid not null
    references public.saas_plans(id),
  status text not null default 'pending'
    check (
      status in (
        'pending',
        'trialing',
        'active',
        'past_due',
        'suspended',
        'canceled',
        'expired'
      )
    ),
  billing_provider text,
  external_customer_id text,
  external_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  trial_start timestamptz,
  trial_end timestamptz,
  activated_at timestamptz,
  suspended_at timestamptz,
  canceled_at timestamptz,
  cancel_at_period_end boolean not null default false,
  plan_snapshot jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists
  company_subscriptions_external_provider_uidx
on public.company_subscriptions (
  billing_provider,
  external_subscription_id
)
where
  billing_provider is not null
  and external_subscription_id is not null;

create unique index if not exists
  company_subscriptions_current_uidx
on public.company_subscriptions (company_id)
where status in (
  'pending',
  'trialing',
  'active',
  'past_due',
  'suspended'
);

create table if not exists public.company_modules (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null
    references public.companies(id) on delete cascade,
  subscription_id uuid
    references public.company_subscriptions(id) on delete set null,
  module_key text not null,
  status text not null default 'inactive'
    check (
      status in (
        'inactive',
        'trialing',
        'active',
        'past_due',
        'suspended',
        'canceled',
        'expired'
      )
    ),
  source text not null default 'subscription'
    check (source in ('subscription', 'addon', 'manual', 'trial')),
  limits jsonb not null default '{}'::jsonb,
  configuration jsonb not null default '{}'::jsonb,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, module_key)
);

create table if not exists public.onboarding_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid references public.saas_plans(id) on delete set null,
  company_id uuid references public.companies(id) on delete set null,
  status text not null default 'started'
    check (
      status in (
        'started',
        'email_pending',
        'plan_selected',
        'payment_pending',
        'payment_confirmed',
        'provisioning',
        'completed',
        'canceled',
        'expired',
        'failed'
      )
    ),
  company_name text,
  contact_name text,
  contact_email text,
  contact_phone text,
  document text,
  billing_provider text,
  external_checkout_id text,
  expires_at timestamptz,
  completed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists
  onboarding_sessions_external_checkout_uidx
on public.onboarding_sessions (
  billing_provider,
  external_checkout_id
)
where
  billing_provider is not null
  and external_checkout_id is not null;

create table if not exists public.subscription_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  subscription_id uuid
    references public.company_subscriptions(id) on delete cascade,
  onboarding_session_id uuid
    references public.onboarding_sessions(id) on delete cascade,
  event_type text not null,
  source text not null default 'system',
  external_event_id text,
  previous_status text,
  new_status text,
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create unique index if not exists
  subscription_events_external_uidx
on public.subscription_events (source, external_event_id)
where external_event_id is not null;

create index if not exists company_subscriptions_company_idx
  on public.company_subscriptions (company_id, status);

create index if not exists company_modules_company_idx
  on public.company_modules (company_id, status);

create index if not exists onboarding_sessions_user_idx
  on public.onboarding_sessions (user_id, status);

create index if not exists subscription_events_company_idx
  on public.subscription_events (company_id, occurred_at desc);

drop trigger if exists trg_saas_plans_updated_at
  on public.saas_plans;
create trigger trg_saas_plans_updated_at
before update on public.saas_plans
for each row execute function public.set_saas_updated_at();

drop trigger if exists trg_saas_plan_features_updated_at
  on public.saas_plan_features;
create trigger trg_saas_plan_features_updated_at
before update on public.saas_plan_features
for each row execute function public.set_saas_updated_at();

drop trigger if exists trg_company_subscriptions_updated_at
  on public.company_subscriptions;
create trigger trg_company_subscriptions_updated_at
before update on public.company_subscriptions
for each row execute function public.set_saas_updated_at();

drop trigger if exists trg_company_modules_updated_at
  on public.company_modules;
create trigger trg_company_modules_updated_at
before update on public.company_modules
for each row execute function public.set_saas_updated_at();

drop trigger if exists trg_onboarding_sessions_updated_at
  on public.onboarding_sessions;
create trigger trg_onboarding_sessions_updated_at
before update on public.onboarding_sessions
for each row execute function public.set_saas_updated_at();

alter table public.saas_plans enable row level security;
alter table public.saas_plan_features enable row level security;
alter table public.company_subscriptions enable row level security;
alter table public.company_modules enable row level security;
alter table public.onboarding_sessions enable row level security;
alter table public.subscription_events enable row level security;

drop policy if exists "saas_plans_public_read"
  on public.saas_plans;
create policy "saas_plans_public_read"
on public.saas_plans
for select
to anon, authenticated
using (status = 'active' and is_public = true);

drop policy if exists "saas_plan_features_public_read"
  on public.saas_plan_features;
create policy "saas_plan_features_public_read"
on public.saas_plan_features
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.saas_plans plan
    where plan.id = plan_id
      and plan.status = 'active'
      and plan.is_public = true
  )
  and is_public = true
);

drop policy if exists "company_subscriptions_member_read"
  on public.company_subscriptions;
create policy "company_subscriptions_member_read"
on public.company_subscriptions
for select
to authenticated
using (public.user_has_company_access(company_id));

drop policy if exists "company_modules_member_read"
  on public.company_modules;
create policy "company_modules_member_read"
on public.company_modules
for select
to authenticated
using (public.user_has_company_access(company_id));

drop policy if exists "onboarding_sessions_owner_read"
  on public.onboarding_sessions;
create policy "onboarding_sessions_owner_read"
on public.onboarding_sessions
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "subscription_events_member_read"
  on public.subscription_events;
create policy "subscription_events_member_read"
on public.subscription_events
for select
to authenticated
using (
  company_id is not null
  and public.user_has_company_access(company_id)
);

grant select on public.saas_plans
  to anon, authenticated;
grant select on public.saas_plan_features
  to anon, authenticated;
grant select on public.company_subscriptions
  to authenticated;
grant select on public.company_modules
  to authenticated;
grant select on public.onboarding_sessions
  to authenticated;
grant select on public.subscription_events
  to authenticated;

grant all on public.saas_plans to service_role;
grant all on public.saas_plan_features to service_role;
grant all on public.company_subscriptions to service_role;
grant all on public.company_modules to service_role;
grant all on public.onboarding_sessions to service_role;
grant all on public.subscription_events to service_role;

comment on table public.saas_plans is
  'Planos comerciais versionáveis do Vectra Commerce.';

comment on table public.company_subscriptions is
  'Assinatura principal e estado comercial de cada empresa.';

comment on table public.company_modules is
  'Módulos contratados, incluindo Marketing e franquias de IA.';

comment on table public.onboarding_sessions is
  'Jornada entre cadastro, pagamento e criação da empresa.';

comment on table public.subscription_events is
  'Histórico auditável de eventos de assinatura e cobrança.';

commit;
