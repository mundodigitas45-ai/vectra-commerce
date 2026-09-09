create table if not exists public.site_analytics_sessions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  site_id uuid not null references public.sites(id) on delete cascade,
  visitor_id uuid not null,
  session_id uuid not null,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  current_path text not null,
  current_title text,
  product_id uuid,
  product_name text,
  referrer_domain text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint site_analytics_sessions_site_session_key
    unique (site_id, session_id)
);

create table if not exists public.site_analytics_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  site_id uuid not null references public.sites(id) on delete cascade,
  visitor_id uuid not null,
  session_id uuid not null,
  event_name text not null check (
    event_name in (
      'page_view',
      'view_product',
      'click_whatsapp',
      'initiate_checkout',
      'purchase'
    )
  ),
  page_path text not null,
  page_title text,
  product_id uuid,
  product_name text,
  referrer_domain text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists
  site_analytics_sessions_online_idx
on public.site_analytics_sessions (
  company_id,
  site_id,
  last_seen_at desc
);

create index if not exists
  site_analytics_sessions_visitors_idx
on public.site_analytics_sessions (
  company_id,
  site_id,
  visitor_id,
  first_seen_at desc
);

create index if not exists
  site_analytics_events_period_idx
on public.site_analytics_events (
  company_id,
  site_id,
  occurred_at desc
);

create index if not exists
  site_analytics_events_name_idx
on public.site_analytics_events (
  company_id,
  site_id,
  event_name,
  occurred_at desc
);

alter table public.site_analytics_sessions
  enable row level security;

alter table public.site_analytics_events
  enable row level security;

revoke all on public.site_analytics_sessions
  from anon, authenticated;

revoke all on public.site_analytics_events
  from anon, authenticated;

create or replace function public.get_site_analytics_summary(
  p_company_id uuid,
  p_site_id uuid,
  p_days integer default 7
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_days integer :=
    greatest(7, least(coalesce(p_days, 7), 30));
  v_today timestamptz :=
    date_trunc(
      'day',
      now() at time zone 'America/Belem'
    ) at time zone 'America/Belem';
  v_period timestamptz;
  v_result jsonb;
begin
  if not exists (
    select 1
    from public.sites s
    where s.id = p_site_id
      and s.company_id = p_company_id
      and s.is_active = true
  ) then
    raise exception 'SITE_NOT_FOUND';
  end if;

  v_period :=
    v_today - ((v_days - 1) * interval '1 day');

  select jsonb_build_object(
    'generated_at', now(),
    'period_days', v_days,
    'online_now', (
      select count(distinct session_id)
      from public.site_analytics_sessions
      where company_id = p_company_id
        and site_id = p_site_id
        and last_seen_at >=
          now() - interval '5 minutes'
    ),
    'visitors_today', (
      select count(distinct visitor_id)
      from public.site_analytics_sessions
      where company_id = p_company_id
        and site_id = p_site_id
        and last_seen_at >= v_today
    ),
    'page_views_today', (
      select count(*)
      from public.site_analytics_events
      where company_id = p_company_id
        and site_id = p_site_id
        and event_name = 'page_view'
        and occurred_at >= v_today
    ),
    'product_views_today', (
      select count(*)
      from public.site_analytics_events
      where company_id = p_company_id
        and site_id = p_site_id
        and event_name = 'view_product'
        and occurred_at >= v_today
    ),
    'whatsapp_clicks_today', (
      select count(*)
      from public.site_analytics_events
      where company_id = p_company_id
        and site_id = p_site_id
        and event_name = 'click_whatsapp'
        and occurred_at >= v_today
    ),
    'checkout_starts_today', (
      select count(*)
      from public.site_analytics_events
      where company_id = p_company_id
        and site_id = p_site_id
        and event_name = 'initiate_checkout'
        and occurred_at >= v_today
    ),
    'orders_today', (
      select count(*)
      from public.site_analytics_events
      where company_id = p_company_id
        and site_id = p_site_id
        and event_name = 'purchase'
        and occurred_at >= v_today
    ),
    'daily', (
      select coalesce(
        jsonb_agg(
          jsonb_build_object(
            'date', day_value::date,
            'visitors', (
              select count(distinct visitor_id)
              from public.site_analytics_sessions s
              where s.company_id = p_company_id
                and s.site_id = p_site_id
                and s.last_seen_at >= day_value
                and s.last_seen_at <
                  day_value + interval '1 day'
            ),
            'page_views', (
              select count(*)
              from public.site_analytics_events e
              where e.company_id = p_company_id
                and e.site_id = p_site_id
                and e.event_name = 'page_view'
                and e.occurred_at >= day_value
                and e.occurred_at <
                  day_value + interval '1 day'
            ),
            'orders', (
              select count(*)
              from public.site_analytics_events e
              where e.company_id = p_company_id
                and e.site_id = p_site_id
                and e.event_name = 'purchase'
                and e.occurred_at >= day_value
                and e.occurred_at <
                  day_value + interval '1 day'
            )
          )
          order by day_value
        ),
        '[]'::jsonb
      )
      from generate_series(
        v_period,
        v_today,
        interval '1 day'
      ) day_value
    ),
    'top_pages', (
      select coalesce(
        jsonb_agg(row_data),
        '[]'::jsonb
      )
      from (
        select jsonb_build_object(
          'path', page_path,
          'views', count(*)
        ) as row_data
        from public.site_analytics_events
        where company_id = p_company_id
          and site_id = p_site_id
          and event_name = 'page_view'
          and occurred_at >= v_period
        group by page_path
        order by count(*) desc
        limit 10
      ) pages
    ),
    'top_products', (
      select coalesce(
        jsonb_agg(row_data),
        '[]'::jsonb
      )
      from (
        select jsonb_build_object(
          'product_id', product_id,
          'product_name',
            coalesce(product_name, 'Produto'),
          'views', count(*)
        ) as row_data
        from public.site_analytics_events
        where company_id = p_company_id
          and site_id = p_site_id
          and event_name = 'view_product'
          and occurred_at >= v_period
          and product_id is not null
        group by product_id, product_name
        order by count(*) desc
        limit 10
      ) products
    )
  ) into v_result;

  return v_result;
end;
$$;

revoke all on function
  public.get_site_analytics_summary(
    uuid,
    uuid,
    integer
  )
from public, anon, authenticated;

grant execute on function
  public.get_site_analytics_summary(
    uuid,
    uuid,
    integer
  )
to service_role;

-- ANALYTICS_SQL_COMPLETE
