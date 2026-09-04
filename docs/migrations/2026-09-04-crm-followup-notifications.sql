begin;

create table if not exists
  public.crm_followup_notifications (
    id uuid primary key
      default gen_random_uuid(),

    company_id uuid not null
      references public.companies(id)
      on delete cascade,

    opportunity_id uuid not null
      references public.crm_opportunities(id)
      on delete cascade,

    scheduled_for timestamptz not null,

    status text not null
      default 'pending'
      check (
        status in (
          'pending',
          'processing',
          'sent',
          'failed'
        )
      ),

    attempt_count integer not null
      default 0
      check (attempt_count >= 0),

    locked_at timestamptz,

    sent_at timestamptz,

    last_error text,

    created_at timestamptz not null
      default now(),

    updated_at timestamptz not null
      default now(),

    unique (
      opportunity_id,
      scheduled_for
    )
  );

create index if not exists
  crm_followup_notifications_status_idx
on public.crm_followup_notifications (
  status,
  scheduled_for
);

create index if not exists
  crm_followup_notifications_company_idx
on public.crm_followup_notifications (
  company_id,
  created_at desc
);

alter table
  public.crm_followup_notifications
enable row level security;

revoke all
on table public.crm_followup_notifications
from public, anon, authenticated;

grant all
on table public.crm_followup_notifications
to service_role;

commit;
