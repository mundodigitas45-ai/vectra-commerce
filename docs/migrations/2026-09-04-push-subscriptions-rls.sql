begin;

alter table public.push_subscriptions
  enable row level security;

revoke all
on table public.push_subscriptions
from anon;

revoke all
on table public.push_subscriptions
from authenticated;

grant select, insert, update, delete
on table public.push_subscriptions
to authenticated;

grant all
on table public.push_subscriptions
to service_role;

drop policy if exists
  push_subscriptions_member_select
on public.push_subscriptions;

create policy
  push_subscriptions_member_select
on public.push_subscriptions
for select
to authenticated
using (
  user_id = auth.uid()
  and exists (
    select 1
    from public.company_users company_user
    where
      company_user.company_id =
        push_subscriptions.company_id
      and company_user.user_id =
        auth.uid()
      and company_user.is_active = true
  )
);

drop policy if exists
  push_subscriptions_member_insert
on public.push_subscriptions;

create policy
  push_subscriptions_member_insert
on public.push_subscriptions
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.company_users company_user
    where
      company_user.company_id =
        push_subscriptions.company_id
      and company_user.user_id =
        auth.uid()
      and company_user.is_active = true
  )
);

drop policy if exists
  push_subscriptions_member_update
on public.push_subscriptions;

create policy
  push_subscriptions_member_update
on public.push_subscriptions
for update
to authenticated
using (
  user_id = auth.uid()
  and exists (
    select 1
    from public.company_users company_user
    where
      company_user.company_id =
        push_subscriptions.company_id
      and company_user.user_id =
        auth.uid()
      and company_user.is_active = true
  )
)
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.company_users company_user
    where
      company_user.company_id =
        push_subscriptions.company_id
      and company_user.user_id =
        auth.uid()
      and company_user.is_active = true
  )
);

drop policy if exists
  push_subscriptions_member_delete
on public.push_subscriptions;

create policy
  push_subscriptions_member_delete
on public.push_subscriptions
for delete
to authenticated
using (
  user_id = auth.uid()
  and exists (
    select 1
    from public.company_users company_user
    where
      company_user.company_id =
        push_subscriptions.company_id
      and company_user.user_id =
        auth.uid()
      and company_user.is_active = true
  )
);

commit;
