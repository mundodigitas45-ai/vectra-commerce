-- Vectra Commerce SaaS
-- Integrações e credenciais isoladas por empresa.
-- Os valores secretos ficam no Supabase Vault.
-- A tabela pública guarda somente vault_secret_id.

begin;

create extension if not exists pgcrypto;
create extension if not exists supabase_vault
  with schema vault;

create table if not exists public.company_integrations (
  id uuid primary key default gen_random_uuid(),

  company_id uuid not null
    references public.companies(id)
    on delete cascade,

  provider text not null
    check (
      provider in (
        'openai',
        'google',
        'evolution'
      )
    ),

  integration_type text not null
    check (
      integration_type in (
        'api_key',
        'oauth',
        'whatsapp_instance'
      )
    ),

  name text not null,

  public_config jsonb not null
    default '{}'::jsonb,

  is_enabled boolean not null
    default false,

  status text not null
    default 'not_configured'
    check (
      status in (
        'not_configured',
        'configured',
        'validating',
        'connected',
        'error',
        'disabled'
      )
    ),

  last_validated_at timestamptz,
  last_error text,

  created_by uuid
    references auth.users(id)
    on delete set null,

  created_at timestamptz not null
    default now(),

  updated_at timestamptz not null
    default now(),

  unique (
    company_id,
    provider,
    integration_type
  ),

  unique (
    id,
    company_id
  )
);

create table if not exists public.company_integration_secrets (
  id uuid primary key default gen_random_uuid(),

  company_id uuid not null
    references public.companies(id)
    on delete cascade,

  company_integration_id uuid not null,

  secret_type text not null,

  vault_secret_id uuid not null,

  created_at timestamptz not null
    default now(),

  updated_at timestamptz not null
    default now(),

  unique (
    company_integration_id,
    secret_type
  ),

  foreign key (
    company_integration_id,
    company_id
  )
  references public.company_integrations (
    id,
    company_id
  )
  on delete cascade
);

create index if not exists
  company_integrations_company_status_idx
on public.company_integrations (
  company_id,
  status
);

create index if not exists
  company_integration_secrets_company_idx
on public.company_integration_secrets (
  company_id,
  company_integration_id
);

drop trigger if exists
  trg_company_integrations_updated_at
on public.company_integrations;

create trigger
  trg_company_integrations_updated_at
before update on public.company_integrations
for each row execute function
  public.set_saas_updated_at();

drop trigger if exists
  trg_company_integration_secrets_updated_at
on public.company_integration_secrets;

create trigger
  trg_company_integration_secrets_updated_at
before update on public.company_integration_secrets
for each row execute function
  public.set_saas_updated_at();

alter table public.company_integrations
  enable row level security;

alter table public.company_integration_secrets
  enable row level security;

drop policy if exists
  "company_integrations_member_read"
on public.company_integrations;

create policy
  "company_integrations_member_read"
on public.company_integrations
for select
to authenticated
using (
  public.user_has_company_access(company_id)
);

revoke all
on public.company_integration_secrets
from anon, authenticated;

grant select
on public.company_integrations
to authenticated;

grant all
on public.company_integrations
to service_role;

grant all
on public.company_integration_secrets
to service_role;

create or replace function
  public.create_company_integration_secret(
    p_company_id uuid,
    p_company_integration_id uuid,
    p_secret_type text,
    p_secret_value text
  )
returns uuid
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  v_secret_reference_id uuid;
  v_vault_secret_id uuid;
  v_secret_name text;
begin
  if p_secret_type is null
     or length(trim(p_secret_type)) = 0
     or p_secret_value is null
     or length(trim(p_secret_value)) = 0
  then
    raise exception
      'INVALID_SECRET_INPUT';
  end if;

  if not exists (
    select 1
    from public.company_integrations integration
    where integration.id =
      p_company_integration_id
      and integration.company_id =
        p_company_id
  ) then
    raise exception
      'COMPANY_INTEGRATION_NOT_FOUND';
  end if;

  if exists (
    select 1
    from public.company_integration_secrets secret
    where secret.company_integration_id =
      p_company_integration_id
      and secret.secret_type =
        p_secret_type
  ) then
    raise exception
      'SECRET_ALREADY_EXISTS';
  end if;

  v_secret_name :=
    'company-integration-' ||
    p_company_id::text || '-' ||
    p_company_integration_id::text || '-' ||
    regexp_replace(
      lower(trim(p_secret_type)),
      '[^a-z0-9_-]+',
      '-',
      'g'
    ) || '-' ||
    gen_random_uuid()::text;

  select vault.create_secret(
    p_secret_value,
    v_secret_name,
    'Vectra Commerce company integration secret'
  )
  into v_vault_secret_id;

  insert into
    public.company_integration_secrets (
      company_id,
      company_integration_id,
      secret_type,
      vault_secret_id
    )
  values (
    p_company_id,
    p_company_integration_id,
    trim(p_secret_type),
    v_vault_secret_id
  )
  returning id
  into v_secret_reference_id;

  return v_secret_reference_id;
end;
$$;

create or replace function
  public.update_company_integration_secret(
    p_company_id uuid,
    p_company_integration_id uuid,
    p_secret_type text,
    p_secret_value text
  )
returns void
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  v_vault_secret_id uuid;
begin
  if p_secret_value is null
     or length(trim(p_secret_value)) = 0
  then
    raise exception
      'INVALID_SECRET_INPUT';
  end if;

  select secret.vault_secret_id
  into v_vault_secret_id
  from public.company_integration_secrets secret
  where secret.company_id =
    p_company_id
    and secret.company_integration_id =
      p_company_integration_id
    and secret.secret_type =
      p_secret_type;

  if v_vault_secret_id is null then
    raise exception
      'COMPANY_INTEGRATION_SECRET_NOT_FOUND';
  end if;

  perform vault.update_secret(
    v_vault_secret_id,
    p_secret_value
  );
end;
$$;

create or replace function
  public.read_company_integration_secret(
    p_company_id uuid,
    p_company_integration_id uuid,
    p_secret_type text
  )
returns text
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  v_secret_value text;
begin
  select decrypted.decrypted_secret
  into v_secret_value
  from public.company_integration_secrets reference
  join vault.decrypted_secrets decrypted
    on decrypted.id =
      reference.vault_secret_id
  where reference.company_id =
    p_company_id
    and reference.company_integration_id =
      p_company_integration_id
    and reference.secret_type =
      p_secret_type;

  if v_secret_value is null then
    raise exception
      'COMPANY_INTEGRATION_SECRET_NOT_FOUND';
  end if;

  return v_secret_value;
end;
$$;

create or replace function
  public.delete_company_integration_secret(
    p_company_id uuid,
    p_company_integration_id uuid,
    p_secret_type text
  )
returns void
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  v_vault_secret_id uuid;
begin
  delete from
    public.company_integration_secrets secret
  where secret.company_id =
    p_company_id
    and secret.company_integration_id =
      p_company_integration_id
    and secret.secret_type =
      p_secret_type
  returning secret.vault_secret_id
  into v_vault_secret_id;

  if v_vault_secret_id is not null then
    delete from vault.secrets
    where id = v_vault_secret_id;
  end if;
end;
$$;

create or replace function
  public.delete_all_company_integration_secrets(
    p_company_id uuid,
    p_company_integration_id uuid
  )
returns integer
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  v_deleted_count integer := 0;
  v_item record;
begin
  for v_item in
    delete from
      public.company_integration_secrets secret
    where secret.company_id =
      p_company_id
      and secret.company_integration_id =
        p_company_integration_id
    returning secret.vault_secret_id
  loop
    delete from vault.secrets
    where id = v_item.vault_secret_id;

    v_deleted_count :=
      v_deleted_count + 1;
  end loop;

  return v_deleted_count;
end;
$$;

revoke all on function
  public.create_company_integration_secret(
    uuid,
    uuid,
    text,
    text
  )
from public, anon, authenticated;

revoke all on function
  public.update_company_integration_secret(
    uuid,
    uuid,
    text,
    text
  )
from public, anon, authenticated;

revoke all on function
  public.read_company_integration_secret(
    uuid,
    uuid,
    text
  )
from public, anon, authenticated;

revoke all on function
  public.delete_company_integration_secret(
    uuid,
    uuid,
    text
  )
from public, anon, authenticated;

revoke all on function
  public.delete_all_company_integration_secrets(
    uuid,
    uuid
  )
from public, anon, authenticated;

grant execute on function
  public.create_company_integration_secret(
    uuid,
    uuid,
    text,
    text
  )
to service_role;

grant execute on function
  public.update_company_integration_secret(
    uuid,
    uuid,
    text,
    text
  )
to service_role;

grant execute on function
  public.read_company_integration_secret(
    uuid,
    uuid,
    text
  )
to service_role;

grant execute on function
  public.delete_company_integration_secret(
    uuid,
    uuid,
    text
  )
to service_role;

grant execute on function
  public.delete_all_company_integration_secrets(
    uuid,
    uuid
  )
to service_role;

comment on table
  public.company_integrations is
  'Integrações operacionais isoladas por empresa.';

comment on table
  public.company_integration_secrets is
  'Referências para segredos criptografados no Supabase Vault.';

comment on function
  public.read_company_integration_secret(
    uuid,
    uuid,
    text
  ) is
  'Leitura restrita ao service_role para execução autorizada.';

commit;
