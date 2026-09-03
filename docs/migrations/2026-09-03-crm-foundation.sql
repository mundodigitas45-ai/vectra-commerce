-- Vectra Commerce SaaS
-- Fundação do CRM comercial multiempresa.
-- Contatos podem existir antes de virarem clientes ou pedidos.

begin;

create extension if not exists pgcrypto;

-- --------------------------------------------------
-- Pipeline
-- --------------------------------------------------

create table if not exists public.crm_pipelines (
  id uuid primary key default gen_random_uuid(),

  company_id uuid not null
    references public.companies(id)
    on delete cascade,

  name text not null,

  description text,

  is_default boolean not null
    default false,

  is_active boolean not null
    default true,

  created_by uuid
    references auth.users(id)
    on delete set null,

  created_at timestamptz not null
    default now(),

  updated_at timestamptz not null
    default now(),

  unique (
    id,
    company_id
  )
);

create unique index if not exists
  crm_pipelines_default_company_uidx
on public.crm_pipelines (
  company_id
)
where is_default = true;

create index if not exists
  crm_pipelines_company_active_idx
on public.crm_pipelines (
  company_id,
  is_active
);

-- --------------------------------------------------
-- Etapas do pipeline
-- --------------------------------------------------

create table if not exists public.crm_stages (
  id uuid primary key default gen_random_uuid(),

  company_id uuid not null,

  pipeline_id uuid not null,

  code text not null,

  name text not null,

  description text,

  position integer not null
    check (position >= 0),

  stage_type text not null
    default 'open'
    check (
      stage_type in (
        'open',
        'won',
        'lost'
      )
    ),

  color text not null
    default '#64748b',

  is_active boolean not null
    default true,

  automation_config jsonb not null
    default '{}'::jsonb,

  created_at timestamptz not null
    default now(),

  updated_at timestamptz not null
    default now(),

  unique (
    pipeline_id,
    code
  ),

  unique (
    id,
    pipeline_id,
    company_id
  ),

  foreign key (
    pipeline_id,
    company_id
  )
  references public.crm_pipelines (
    id,
    company_id
  )
  on delete cascade
);

create index if not exists
  crm_stages_pipeline_position_idx
on public.crm_stages (
  company_id,
  pipeline_id,
  position
);

-- --------------------------------------------------
-- Contatos
-- Um contato pode existir antes do cadastro em customers.
-- --------------------------------------------------

create table if not exists public.crm_contacts (
  id uuid primary key default gen_random_uuid(),

  company_id uuid not null
    references public.companies(id)
    on delete cascade,

  customer_id uuid
    references public.customers(id)
    on delete set null,

  store_id uuid
    references public.stores(id)
    on delete set null,

  channel text not null
    default 'whatsapp'
    check (
      channel in (
        'whatsapp',
        'phone',
        'email',
        'site',
        'manual'
      )
    ),

  channel_identifier text not null,

  whatsapp_instance_name text,

  name text,

  phone text,

  email text,

  source text not null
    default 'whatsapp',

  status text not null
    default 'active'
    check (
      status in (
        'active',
        'blocked',
        'archived'
      )
    ),

  last_interaction_at timestamptz,

  metadata jsonb not null
    default '{}'::jsonb,

  created_by uuid
    references auth.users(id)
    on delete set null,

  created_at timestamptz not null
    default now(),

  updated_at timestamptz not null
    default now(),

  check (
    length(trim(channel_identifier)) > 0
  ),

  unique (
    company_id,
    channel,
    channel_identifier
  ),

  unique (
    id,
    company_id
  )
);

create index if not exists
  crm_contacts_company_recent_idx
on public.crm_contacts (
  company_id,
  last_interaction_at desc
);

create index if not exists
  crm_contacts_customer_idx
on public.crm_contacts (
  company_id,
  customer_id
)
where customer_id is not null;

create index if not exists
  crm_contacts_instance_idx
on public.crm_contacts (
  company_id,
  whatsapp_instance_name
)
where whatsapp_instance_name is not null;

-- --------------------------------------------------
-- Oportunidades
-- --------------------------------------------------

create table if not exists public.crm_opportunities (
  id uuid primary key default gen_random_uuid(),

  company_id uuid not null
    references public.companies(id)
    on delete cascade,

  pipeline_id uuid not null,

  stage_id uuid not null,

  contact_id uuid not null,

  customer_id uuid
    references public.customers(id)
    on delete set null,

  store_id uuid
    references public.stores(id)
    on delete set null,

  order_id uuid
    references public.orders(id)
    on delete set null,

  assigned_user_id uuid
    references auth.users(id)
    on delete set null,

  title text not null,

  status text not null
    default 'open'
    check (
      status in (
        'open',
        'won',
        'lost',
        'archived'
      )
    ),

  priority text not null
    default 'normal'
    check (
      priority in (
        'low',
        'normal',
        'high',
        'urgent'
      )
    ),

  estimated_value numeric(14, 2),

  currency char(3) not null
    default 'BRL',

  product_context jsonb not null
    default '{}'::jsonb,

  device_context jsonb not null
    default '{}'::jsonb,

  next_action_at timestamptz,

  last_activity_at timestamptz,

  won_at timestamptz,

  lost_at timestamptz,

  lost_reason text,

  metadata jsonb not null
    default '{}'::jsonb,

  created_by uuid
    references auth.users(id)
    on delete set null,

  created_at timestamptz not null
    default now(),

  updated_at timestamptz not null
    default now(),

  check (
    estimated_value is null
    or estimated_value >= 0
  ),

  check (
    status <> 'won'
    or won_at is not null
  ),

  check (
    status <> 'lost'
    or lost_at is not null
  ),

  unique (
    id,
    company_id
  ),

  foreign key (
    pipeline_id,
    company_id
  )
  references public.crm_pipelines (
    id,
    company_id
  ),

  foreign key (
    stage_id,
    pipeline_id,
    company_id
  )
  references public.crm_stages (
    id,
    pipeline_id,
    company_id
  ),

  foreign key (
    contact_id,
    company_id
  )
  references public.crm_contacts (
    id,
    company_id
  )
  on delete cascade
);

create index if not exists
  crm_opportunities_board_idx
on public.crm_opportunities (
  company_id,
  pipeline_id,
  stage_id,
  status,
  updated_at desc
);

create index if not exists
  crm_opportunities_contact_idx
on public.crm_opportunities (
  company_id,
  contact_id,
  status
);

create index if not exists
  crm_opportunities_assigned_idx
on public.crm_opportunities (
  company_id,
  assigned_user_id,
  status
)
where assigned_user_id is not null;

create index if not exists
  crm_opportunities_next_action_idx
on public.crm_opportunities (
  company_id,
  next_action_at
)
where
  next_action_at is not null
  and status = 'open';

-- --------------------------------------------------
-- Atividades e histórico
-- --------------------------------------------------

create table if not exists public.crm_activities (
  id uuid primary key default gen_random_uuid(),

  company_id uuid not null
    references public.companies(id)
    on delete cascade,

  opportunity_id uuid,

  contact_id uuid not null,

  customer_id uuid
    references public.customers(id)
    on delete set null,

  order_id uuid
    references public.orders(id)
    on delete set null,

  activity_type text not null,

  direction text
    check (
      direction is null
      or direction in (
        'inbound',
        'outbound',
        'internal'
      )
    ),

  title text,

  description text,

  external_id text,

  occurred_at timestamptz not null
    default now(),

  metadata jsonb not null
    default '{}'::jsonb,

  created_by uuid
    references auth.users(id)
    on delete set null,

  created_at timestamptz not null
    default now(),

  unique (
    company_id,
    external_id
  ),

  foreign key (
    opportunity_id,
    company_id
  )
  references public.crm_opportunities (
    id,
    company_id
  )
  on delete cascade,

  foreign key (
    contact_id,
    company_id
  )
  references public.crm_contacts (
    id,
    company_id
  )
  on delete cascade
);

create index if not exists
  crm_activities_opportunity_time_idx
on public.crm_activities (
  company_id,
  opportunity_id,
  occurred_at desc
);

create index if not exists
  crm_activities_contact_time_idx
on public.crm_activities (
  company_id,
  contact_id,
  occurred_at desc
);

-- --------------------------------------------------
-- Etiquetas
-- --------------------------------------------------

create table if not exists public.crm_tags (
  id uuid primary key default gen_random_uuid(),

  company_id uuid not null
    references public.companies(id)
    on delete cascade,

  name text not null,

  color text not null
    default '#64748b',

  created_at timestamptz not null
    default now(),

  updated_at timestamptz not null
    default now(),

  unique (
    company_id,
    name
  ),

  unique (
    id,
    company_id
  )
);

create table if not exists public.crm_contact_tags (
  company_id uuid not null,

  contact_id uuid not null,

  tag_id uuid not null,

  created_at timestamptz not null
    default now(),

  primary key (
    contact_id,
    tag_id
  ),

  foreign key (
    contact_id,
    company_id
  )
  references public.crm_contacts (
    id,
    company_id
  )
  on delete cascade,

  foreign key (
    tag_id,
    company_id
  )
  references public.crm_tags (
    id,
    company_id
  )
  on delete cascade
);

create index if not exists
  crm_contact_tags_company_idx
on public.crm_contact_tags (
  company_id,
  tag_id
);

-- --------------------------------------------------
-- Validação contra vínculos de outra empresa
-- --------------------------------------------------

create or replace function
  public.crm_validate_contact_company()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.customer_id is not null
     and not exists (
       select 1
       from public.customers customer
       where customer.id = new.customer_id
         and customer.company_id =
           new.company_id
     )
  then
    raise exception
      'CRM_CUSTOMER_COMPANY_MISMATCH';
  end if;

  if new.store_id is not null
     and not exists (
       select 1
       from public.stores store
       where store.id = new.store_id
         and store.company_id =
           new.company_id
     )
  then
    raise exception
      'CRM_STORE_COMPANY_MISMATCH';
  end if;

  return new;
end;
$$;

create or replace function
  public.crm_validate_opportunity_company()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.customer_id is not null
     and not exists (
       select 1
       from public.customers customer
       where customer.id = new.customer_id
         and customer.company_id =
           new.company_id
     )
  then
    raise exception
      'CRM_CUSTOMER_COMPANY_MISMATCH';
  end if;

  if new.store_id is not null
     and not exists (
       select 1
       from public.stores store
       where store.id = new.store_id
         and store.company_id =
           new.company_id
     )
  then
    raise exception
      'CRM_STORE_COMPANY_MISMATCH';
  end if;

  if new.order_id is not null
     and not exists (
       select 1
       from public.orders customer_order
       where customer_order.id =
         new.order_id
         and customer_order.company_id =
           new.company_id
     )
  then
    raise exception
      'CRM_ORDER_COMPANY_MISMATCH';
  end if;

  if new.assigned_user_id is not null
     and not exists (
       select 1
       from public.company_users member
       where member.company_id =
         new.company_id
         and member.user_id =
           new.assigned_user_id
         and member.is_active = true
     )
     and not exists (
       select 1
       from public.companies company
       where company.id =
         new.company_id
         and company.owner_user_id =
           new.assigned_user_id
     )
  then
    raise exception
      'CRM_ASSIGNEE_COMPANY_MISMATCH';
  end if;

  return new;
end;
$$;

create or replace function
  public.crm_validate_activity_company()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.customer_id is not null
     and not exists (
       select 1
       from public.customers customer
       where customer.id = new.customer_id
         and customer.company_id =
           new.company_id
     )
  then
    raise exception
      'CRM_CUSTOMER_COMPANY_MISMATCH';
  end if;

  if new.order_id is not null
     and not exists (
       select 1
       from public.orders customer_order
       where customer_order.id =
         new.order_id
         and customer_order.company_id =
           new.company_id
     )
  then
    raise exception
      'CRM_ORDER_COMPANY_MISMATCH';
  end if;

  return new;
end;
$$;

drop trigger if exists
  trg_crm_contacts_company_guard
on public.crm_contacts;

create trigger
  trg_crm_contacts_company_guard
before insert or update
on public.crm_contacts
for each row execute function
  public.crm_validate_contact_company();

drop trigger if exists
  trg_crm_opportunities_company_guard
on public.crm_opportunities;

create trigger
  trg_crm_opportunities_company_guard
before insert or update
on public.crm_opportunities
for each row execute function
  public.crm_validate_opportunity_company();

drop trigger if exists
  trg_crm_activities_company_guard
on public.crm_activities;

create trigger
  trg_crm_activities_company_guard
before insert or update
on public.crm_activities
for each row execute function
  public.crm_validate_activity_company();

-- --------------------------------------------------
-- updated_at
-- --------------------------------------------------

drop trigger if exists
  trg_crm_pipelines_updated_at
on public.crm_pipelines;

create trigger
  trg_crm_pipelines_updated_at
before update on public.crm_pipelines
for each row execute function
  public.set_saas_updated_at();

drop trigger if exists
  trg_crm_stages_updated_at
on public.crm_stages;

create trigger
  trg_crm_stages_updated_at
before update on public.crm_stages
for each row execute function
  public.set_saas_updated_at();

drop trigger if exists
  trg_crm_contacts_updated_at
on public.crm_contacts;

create trigger
  trg_crm_contacts_updated_at
before update on public.crm_contacts
for each row execute function
  public.set_saas_updated_at();

drop trigger if exists
  trg_crm_opportunities_updated_at
on public.crm_opportunities;

create trigger
  trg_crm_opportunities_updated_at
before update on public.crm_opportunities
for each row execute function
  public.set_saas_updated_at();

drop trigger if exists
  trg_crm_tags_updated_at
on public.crm_tags;

create trigger
  trg_crm_tags_updated_at
before update on public.crm_tags
for each row execute function
  public.set_saas_updated_at();

-- --------------------------------------------------
-- Pipeline padrão para empresas existentes e futuras
-- --------------------------------------------------

create or replace function
  public.ensure_company_crm_pipeline(
    p_company_id uuid
  )
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pipeline_id uuid;
begin
  if not exists (
    select 1
    from public.companies company
    where company.id = p_company_id
  ) then
    raise exception
      'CRM_COMPANY_NOT_FOUND';
  end if;

  select pipeline.id
  into v_pipeline_id
  from public.crm_pipelines pipeline
  where pipeline.company_id =
    p_company_id
    and pipeline.is_default = true
  limit 1;

  if v_pipeline_id is null then
    insert into public.crm_pipelines (
      company_id,
      name,
      description,
      is_default,
      is_active
    )
    values (
      p_company_id,
      'Funil comercial',
      'Etapas padrão de atendimento e vendas.',
      true,
      true
    )
    on conflict do nothing
    returning id
    into v_pipeline_id;

    if v_pipeline_id is null then
      select pipeline.id
      into v_pipeline_id
      from public.crm_pipelines pipeline
      where pipeline.company_id =
        p_company_id
        and pipeline.is_default = true
      limit 1;
    end if;
  end if;

  insert into public.crm_stages (
    company_id,
    pipeline_id,
    code,
    name,
    position,
    stage_type,
    color
  )
  values
    (
      p_company_id,
      v_pipeline_id,
      'new_contact',
      'Novo contato',
      10,
      'open',
      '#3b82f6'
    ),
    (
      p_company_id,
      v_pipeline_id,
      'in_service',
      'Em atendimento',
      20,
      'open',
      '#8b5cf6'
    ),
    (
      p_company_id,
      v_pipeline_id,
      'product_identified',
      'Produto identificado',
      30,
      'open',
      '#06b6d4'
    ),
    (
      p_company_id,
      v_pipeline_id,
      'compatibility_confirmed',
      'Compatibilidade confirmada',
      40,
      'open',
      '#14b8a6'
    ),
    (
      p_company_id,
      v_pipeline_id,
      'awaiting_address',
      'Aguardando endereço',
      50,
      'open',
      '#f59e0b'
    ),
    (
      p_company_id,
      v_pipeline_id,
      'awaiting_confirmation',
      'Aguardando confirmação',
      60,
      'open',
      '#f97316'
    ),
    (
      p_company_id,
      v_pipeline_id,
      'order_created',
      'Pedido criado',
      70,
      'open',
      '#6366f1'
    ),
    (
      p_company_id,
      v_pipeline_id,
      'won',
      'Venda concluída',
      80,
      'won',
      '#22c55e'
    ),
    (
      p_company_id,
      v_pipeline_id,
      'post_sale',
      'Pós-venda',
      90,
      'won',
      '#10b981'
    ),
    (
      p_company_id,
      v_pipeline_id,
      'lost',
      'Perdido ou cancelado',
      100,
      'lost',
      '#ef4444'
    )
  on conflict (
    pipeline_id,
    code
  )
  do update set
    name = excluded.name,
    position = excluded.position,
    stage_type = excluded.stage_type,
    color = excluded.color,
    is_active = true,
    updated_at = now();

  return v_pipeline_id;
end;
$$;

create or replace function
  public.create_default_crm_for_company()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.ensure_company_crm_pipeline(
    new.id
  );

  return new;
end;
$$;

drop trigger if exists
  trg_companies_create_default_crm
on public.companies;

create trigger
  trg_companies_create_default_crm
after insert on public.companies
for each row execute function
  public.create_default_crm_for_company();

select public.ensure_company_crm_pipeline(
  company.id
)
from public.companies company;

-- --------------------------------------------------
-- Converte clientes existentes em contatos do CRM.
-- Não cria oportunidades automaticamente.
-- --------------------------------------------------

with customer_contacts as (
  select distinct on (
    customer.company_id,
    case
      when length(
        regexp_replace(
          coalesce(customer.phone, ''),
          '[^0-9]+',
          '',
          'g'
        )
      ) > 0
      then 'whatsapp'
      else 'manual'
    end,
    case
      when length(
        regexp_replace(
          coalesce(customer.phone, ''),
          '[^0-9]+',
          '',
          'g'
        )
      ) > 0
      then regexp_replace(
        customer.phone,
        '[^0-9]+',
        '',
        'g'
      )
      else 'customer:' ||
        customer.id::text
    end
  )
    customer.id,
    customer.company_id,
    customer.name,
    customer.phone,
    customer.email,
    customer.is_active,
    customer.updated_at,

    case
      when length(
        regexp_replace(
          coalesce(customer.phone, ''),
          '[^0-9]+',
          '',
          'g'
        )
      ) > 0
      then 'whatsapp'
      else 'manual'
    end as channel,

    case
      when length(
        regexp_replace(
          coalesce(customer.phone, ''),
          '[^0-9]+',
          '',
          'g'
        )
      ) > 0
      then regexp_replace(
        customer.phone,
        '[^0-9]+',
        '',
        'g'
      )
      else 'customer:' ||
        customer.id::text
    end as channel_identifier

  from public.customers customer

  order by
    customer.company_id,
    channel,
    channel_identifier,
    customer.updated_at desc,
    customer.id
)
insert into public.crm_contacts (
  company_id,
  customer_id,
  channel,
  channel_identifier,
  name,
  phone,
  email,
  source,
  status,
  last_interaction_at,
  metadata
)
select
  customer.company_id,
  customer.id,
  customer.channel,
  customer.channel_identifier,
  customer.name,
  customer.phone,
  customer.email,
  'customer_migration',
  case
    when customer.is_active
    then 'active'
    else 'archived'
  end,
  customer.updated_at,
  jsonb_build_object(
    'migrated_from',
    'customers'
  )
from customer_contacts customer
on conflict (
  company_id,
  channel,
  channel_identifier
)
do update set
  customer_id =
    coalesce(
      crm_contacts.customer_id,
      excluded.customer_id
    ),
  name =
    coalesce(
      crm_contacts.name,
      excluded.name
    ),
  phone =
    coalesce(
      crm_contacts.phone,
      excluded.phone
    ),
  email =
    coalesce(
      crm_contacts.email,
      excluded.email
    ),
  updated_at = now();

-- --------------------------------------------------
-- RLS e permissões
-- --------------------------------------------------

alter table public.crm_pipelines
  enable row level security;

alter table public.crm_stages
  enable row level security;

alter table public.crm_contacts
  enable row level security;

alter table public.crm_opportunities
  enable row level security;

alter table public.crm_activities
  enable row level security;

alter table public.crm_tags
  enable row level security;

alter table public.crm_contact_tags
  enable row level security;

drop policy if exists
  "crm_pipelines_member_read"
on public.crm_pipelines;

create policy
  "crm_pipelines_member_read"
on public.crm_pipelines
for select
to authenticated
using (
  public.user_has_company_access(company_id)
);

drop policy if exists
  "crm_stages_member_read"
on public.crm_stages;

create policy
  "crm_stages_member_read"
on public.crm_stages
for select
to authenticated
using (
  public.user_has_company_access(company_id)
);

drop policy if exists
  "crm_contacts_member_read"
on public.crm_contacts;

create policy
  "crm_contacts_member_read"
on public.crm_contacts
for select
to authenticated
using (
  public.user_has_company_access(company_id)
);

drop policy if exists
  "crm_opportunities_member_read"
on public.crm_opportunities;

create policy
  "crm_opportunities_member_read"
on public.crm_opportunities
for select
to authenticated
using (
  public.user_has_company_access(company_id)
);

drop policy if exists
  "crm_activities_member_read"
on public.crm_activities;

create policy
  "crm_activities_member_read"
on public.crm_activities
for select
to authenticated
using (
  public.user_has_company_access(company_id)
);

drop policy if exists
  "crm_tags_member_read"
on public.crm_tags;

create policy
  "crm_tags_member_read"
on public.crm_tags
for select
to authenticated
using (
  public.user_has_company_access(company_id)
);

drop policy if exists
  "crm_contact_tags_member_read"
on public.crm_contact_tags;

create policy
  "crm_contact_tags_member_read"
on public.crm_contact_tags
for select
to authenticated
using (
  public.user_has_company_access(company_id)
);

grant select
on
  public.crm_pipelines,
  public.crm_stages,
  public.crm_contacts,
  public.crm_opportunities,
  public.crm_activities,
  public.crm_tags,
  public.crm_contact_tags
to authenticated;

grant all
on
  public.crm_pipelines,
  public.crm_stages,
  public.crm_contacts,
  public.crm_opportunities,
  public.crm_activities,
  public.crm_tags,
  public.crm_contact_tags
to service_role;

revoke all
on function
  public.ensure_company_crm_pipeline(uuid)
from public, anon, authenticated;

grant execute
on function
  public.ensure_company_crm_pipeline(uuid)
to service_role;

commit;
