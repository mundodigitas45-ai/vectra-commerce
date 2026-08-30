-- Uma única jornada aberta por usuário.
-- Migration complementar: a fundação anterior já foi aplicada.

begin;

create unique index if not exists
  onboarding_sessions_current_user_uidx
on public.onboarding_sessions (user_id)
where status in (
  'started',
  'email_pending',
  'plan_selected',
  'payment_pending',
  'payment_confirmed',
  'provisioning'
);

comment on index
  public.onboarding_sessions_current_user_uidx
is
  'Impede jornadas simultâneas de contratação para o mesmo usuário.';

commit;
