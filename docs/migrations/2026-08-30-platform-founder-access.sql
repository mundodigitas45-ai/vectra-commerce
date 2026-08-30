-- Acesso permanente do fundador do Vectra Commerce.
-- Esta migration somente concede acesso; não remove nem bloqueia permissões.

begin;

create table if not exists public.platform_user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null
    check (role in ('founder', 'platform_admin', 'support')),
  is_active boolean not null default true,
  granted_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, role)
);

drop trigger if exists trg_platform_user_roles_updated_at
  on public.platform_user_roles;

create trigger trg_platform_user_roles_updated_at
before update on public.platform_user_roles
for each row execute function public.set_saas_updated_at();

alter table public.platform_user_roles
  enable row level security;

drop policy if exists "platform_user_roles_self_read"
  on public.platform_user_roles;

create policy "platform_user_roles_self_read"
on public.platform_user_roles
for select
to authenticated
using (user_id = auth.uid());

grant select on public.platform_user_roles
  to authenticated;

grant all on public.platform_user_roles
  to service_role;

create or replace function public.is_platform_privileged()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    auth.uid() is not null
    and exists (
      select 1
      from public.platform_user_roles role_entry
      where role_entry.user_id = auth.uid()
        and role_entry.role in ('founder', 'platform_admin')
        and role_entry.is_active = true
    );
$$;

grant execute on function
  public.is_platform_privileged()
to authenticated;

do $$
declare
  founder_company_id constant uuid :=
    'e2e1f5bc-3f6c-4868-9d9c-5c8226df9b3d';

  founder_user_id uuid;
  founder_plan_id uuid;
  founder_subscription_id uuid;
begin
  select owner_user_id
    into founder_user_id
  from public.companies
  where id = founder_company_id;

  if founder_user_id is null then
    raise exception
      'FOUNDER_OWNER_NOT_FOUND_FOR_COMPANY';
  end if;

  insert into public.platform_user_roles (
    user_id,
    role,
    is_active,
    granted_reason
  )
  values (
    founder_user_id,
    'founder',
    true,
    'Criador e proprietário do projeto Vectra Commerce'
  )
  on conflict (user_id, role)
  do update set
    is_active = true,
    granted_reason = excluded.granted_reason,
    updated_at = now();

  insert into public.saas_plans (
    code,
    name,
    description,
    status,
    billing_interval,
    price_amount,
    currency,
    trial_days,
    sort_order,
    is_public,
    metadata
  )
  values (
    'founder-lifetime',
    'Fundador Vitalício',
    'Acesso premium vitalício do fundador do Vectra Commerce.',
    'active',
    'one_time',
    0,
    'BRL',
    0,
    -1000,
    false,
    jsonb_build_object(
      'internal', true,
      'billing_exempt', true,
      'unlimited', true
    )
  )
  on conflict (code)
  do update set
    name = excluded.name,
    description = excluded.description,
    status = 'active',
    billing_interval = 'one_time',
    price_amount = 0,
    is_public = false,
    metadata = excluded.metadata,
    updated_at = now()
  returning id into founder_plan_id;

  select id
    into founder_subscription_id
  from public.company_subscriptions
  where company_id = founder_company_id
    and status in (
      'pending',
      'trialing',
      'active',
      'past_due',
      'suspended'
    )
  order by created_at desc
  limit 1;

  if founder_subscription_id is null then
    insert into public.company_subscriptions (
      company_id,
      plan_id,
      status,
      billing_provider,
      activated_at,
      current_period_start,
      current_period_end,
      cancel_at_period_end,
      plan_snapshot,
      metadata,
      created_by
    )
    values (
      founder_company_id,
      founder_plan_id,
      'active',
      'internal',
      now(),
      now(),
      null,
      false,
      jsonb_build_object(
        'code', 'founder-lifetime',
        'name', 'Fundador Vitalício',
        'unlimited', true
      ),
      jsonb_build_object(
        'billing_exempt', true,
        'never_expires', true
      ),
      founder_user_id
    )
    returning id into founder_subscription_id;
  else
    update public.company_subscriptions
    set
      plan_id = founder_plan_id,
      status = 'active',
      billing_provider = 'internal',
      activated_at = coalesce(activated_at, now()),
      current_period_end = null,
      cancel_at_period_end = false,
      plan_snapshot = jsonb_build_object(
        'code', 'founder-lifetime',
        'name', 'Fundador Vitalício',
        'unlimited', true
      ),
      metadata = metadata || jsonb_build_object(
        'billing_exempt', true,
        'never_expires', true
      ),
      updated_at = now()
    where id = founder_subscription_id;
  end if;

  insert into public.company_modules (
    company_id,
    subscription_id,
    module_key,
    status,
    source,
    limits,
    configuration,
    starts_at,
    ends_at
  )
  select
    founder_company_id,
    founder_subscription_id,
    module_key,
    'active',
    'manual',
    jsonb_build_object('unlimited', true),
    jsonb_build_object(
      'founder_access', true,
      'billing_exempt', true
    ),
    now(),
    null
  from unnest(array[
    'commerce_core',
    'sites_integrations',
    'whatsapp_automation',
    'creative_center',
    'marketing_ai',
    'image_generation',
    'video_generation'
  ]) as module_key
  on conflict (company_id, module_key)
  do update set
    subscription_id = excluded.subscription_id,
    status = 'active',
    source = 'manual',
    limits = excluded.limits,
    configuration = excluded.configuration,
    starts_at = coalesce(
      public.company_modules.starts_at,
      now()
    ),
    ends_at = null,
    updated_at = now();
end;
$$;

comment on table public.platform_user_roles is
  'Papéis globais da plataforma, separados das funções de cada empresa.';

comment on function public.is_platform_privileged() is
  'Liberação global para fundador e administradores da plataforma.';

commit;
