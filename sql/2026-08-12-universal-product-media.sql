-- Miranda Express / Vectra Commerce
-- Biblioteca universal de mídias por produto.
-- Executar no Supabase do projeto antes de ativar os novos endpoints.

create table if not exists public.product_media (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  media_type text not null check (media_type in ('image','video')),
  source text not null default 'google_drive' check (source in ('google_drive','upload','external')),
  drive_file_id text,
  file_name text,
  mime_type text,
  storage_bucket text,
  storage_path text,
  public_url text not null,
  alt_text text,
  is_primary boolean not null default false,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists product_media_product_idx
  on public.product_media(product_id, is_active, sort_order, created_at);

create index if not exists product_media_company_idx
  on public.product_media(company_id, product_id);

-- Mantém compatibilidade com sites/fluxos antigos que ainda leem products.image_url.
create or replace function public.sync_product_primary_media()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_product_id uuid;
begin
  target_product_id := case when tg_op = 'DELETE' then old.product_id else new.product_id end;

  if tg_op <> 'DELETE' and new.is_primary = true and new.is_active = true then
    update public.product_media
       set is_primary = false,
           updated_at = now()
     where product_id = new.product_id
       and id <> new.id
       and is_primary = true;
  end if;

  update public.products p
     set image_url = (
       select pm.public_url
         from public.product_media pm
        where pm.product_id = target_product_id
          and pm.is_active = true
          and pm.media_type = 'image'
        order by pm.is_primary desc, pm.sort_order asc, pm.created_at asc
        limit 1
     )
   where p.id = target_product_id;

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

drop trigger if exists trg_sync_product_primary_media on public.product_media;
create trigger trg_sync_product_primary_media
after insert or update or delete on public.product_media
for each row execute function public.sync_product_primary_media();

alter table public.product_media enable row level security;

-- Leitura para usuários autenticados; escrita administrativa continua pela API com service role.
drop policy if exists "product_media_authenticated_read" on public.product_media;
create policy "product_media_authenticated_read"
on public.product_media
for select
to authenticated
using (true);

comment on table public.product_media is
  'Biblioteca universal de imagens e vídeos vinculados a produtos. products.image_url é mantido como compatibilidade legada.';
