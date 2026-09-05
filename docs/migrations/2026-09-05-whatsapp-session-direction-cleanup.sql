-- Vectra Commerce
-- Saneamento de sessões contaminadas por mensagens outbound.
--
-- Problema corrigido:
-- mensagens from_me=true foram gravadas como last_customer_message
-- e algumas ativaram human_takeover automaticamente.
--
-- Esta migração:
-- 1. seleciona somente mensagens claramente institucionais da loja;
-- 2. preserva o conteúdo como last_bot_message quando necessário;
-- 3. limpa last_customer_message;
-- 4. libera apenas pausas automáticas legadas;
-- 5. não altera sessões humanas sem contaminação comprovada.

begin;

create temporary table whatsapp_sessions_direction_cleanup
on commit drop
as
select
  id,
  customer_number,
  last_customer_message,
  last_bot_message,
  human_takeover,
  human_takeover_at,
  human_takeover_by,
  automation_paused_until,
  updated_at
from public.whatsapp_order_sessions
where
  last_customer_message ilike '%Miranda Express%'
  or last_customer_message ilike '%vectradev.shop%'
  or last_customer_message ilike '%pagamento é feito somente na entrega%'
  or last_customer_message ilike '%pagamento e feito somente na entrega%';

do $$
declare
  affected_count integer;
begin
  select count(*)
  into affected_count
  from whatsapp_sessions_direction_cleanup;

  if affected_count = 0 then
    raise exception
      'Nenhuma sessão contaminada encontrada; saneamento cancelado.';
  end if;

  if affected_count > 150 then
    raise exception
      'Quantidade inesperada de sessões: %. Limite de segurança: 150.',
      affected_count;
  end if;
end
$$;

update public.whatsapp_order_sessions as session
set
  last_bot_message =
    case
      when nullif(
        btrim(
          coalesce(
            session.last_bot_message,
            ''
          )
        ),
        ''
      ) is null
      then cleanup.last_customer_message
      else session.last_bot_message
    end,

  last_customer_message = null,

  human_takeover =
    case
      when
        cleanup.human_takeover = true
        and (
          cleanup.human_takeover_by =
            'atendente-whatsapp'
          or cleanup.last_customer_message
            ilike '%Miranda Express%'
          or cleanup.last_customer_message
            ilike '%vectradev.shop%'
        )
      then false
      else session.human_takeover
    end,

  human_takeover_at =
    case
      when
        cleanup.human_takeover = true
        and (
          cleanup.human_takeover_by =
            'atendente-whatsapp'
          or cleanup.last_customer_message
            ilike '%Miranda Express%'
          or cleanup.last_customer_message
            ilike '%vectradev.shop%'
        )
      then null
      else session.human_takeover_at
    end,

  human_takeover_by =
    case
      when
        cleanup.human_takeover = true
        and (
          cleanup.human_takeover_by =
            'atendente-whatsapp'
          or cleanup.last_customer_message
            ilike '%Miranda Express%'
          or cleanup.last_customer_message
            ilike '%vectradev.shop%'
        )
      then null
      else session.human_takeover_by
    end,

  automation_paused_until =
    case
      when
        cleanup.human_takeover = true
        and (
          cleanup.human_takeover_by =
            'atendente-whatsapp'
          or cleanup.last_customer_message
            ilike '%Miranda Express%'
          or cleanup.last_customer_message
            ilike '%vectradev.shop%'
        )
      then null
      else session.automation_paused_until
    end,

  updated_at = now()
from whatsapp_sessions_direction_cleanup
  as cleanup
where session.id = cleanup.id;

do $$
declare
  remaining_contaminated integer;
begin
  select count(*)
  into remaining_contaminated
  from public.whatsapp_order_sessions
  where
    last_customer_message ilike '%Miranda Express%'
    or last_customer_message ilike '%vectradev.shop%'
    or last_customer_message ilike '%pagamento é feito somente na entrega%'
    or last_customer_message ilike '%pagamento e feito somente na entrega%';

  if remaining_contaminated <> 0 then
    raise exception
      'Ainda existem % sessões contaminadas.',
      remaining_contaminated;
  end if;
end
$$;

commit;
