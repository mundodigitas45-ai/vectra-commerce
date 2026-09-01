-- Vectra Commerce SaaS
-- Direitos internos para integrações próprias por plano.
-- Não altera os textos públicos atuais dos planos.

begin;

with entitlement_values (
  plan_code,
  feature_key,
  feature_name,
  limit_value,
  configuration
) as (
  values
    (
      'essential',
      'byok_openai',
      'Chave OpenAI própria',
      1::bigint,
      '{"provider":"openai","billing":"customer","included":true}'::jsonb
    ),
    (
      'essential',
      'google_oauth_accounts',
      'Conta Google própria',
      1::bigint,
      '{"provider":"google","billing":"customer","included":true}'::jsonb
    ),
    (
      'essential',
      'whatsapp_connections',
      'Conexão WhatsApp',
      1::bigint,
      '{"provider":"evolution","included":true}'::jsonb
    ),

    (
      'professional',
      'byok_openai',
      'Chave OpenAI própria',
      1::bigint,
      '{"provider":"openai","billing":"customer","included":true}'::jsonb
    ),
    (
      'professional',
      'google_oauth_accounts',
      'Conta Google própria',
      1::bigint,
      '{"provider":"google","billing":"customer","included":true}'::jsonb
    ),
    (
      'professional',
      'whatsapp_connections',
      'Conexão WhatsApp',
      1::bigint,
      '{"provider":"evolution","included":true}'::jsonb
    ),

    (
      'premium',
      'byok_openai',
      'Chave OpenAI própria',
      1::bigint,
      '{"provider":"openai","billing":"customer","included":true}'::jsonb
    ),
    (
      'premium',
      'google_oauth_accounts',
      'Contas Google próprias',
      3::bigint,
      '{"provider":"google","billing":"customer","included":true}'::jsonb
    ),
    (
      'premium',
      'whatsapp_connections',
      'Conexões WhatsApp',
      3::bigint,
      '{"provider":"evolution","included":true}'::jsonb
    ),

    (
      'founder-lifetime',
      'byok_openai',
      'Chave OpenAI própria',
      null::bigint,
      '{"provider":"openai","billing":"customer","included":true,"unlimited":true}'::jsonb
    ),
    (
      'founder-lifetime',
      'google_oauth_accounts',
      'Contas Google próprias',
      null::bigint,
      '{"provider":"google","billing":"customer","included":true,"unlimited":true}'::jsonb
    ),
    (
      'founder-lifetime',
      'whatsapp_connections',
      'Conexões WhatsApp',
      null::bigint,
      '{"provider":"evolution","included":true,"unlimited":true}'::jsonb
    )
)
insert into public.saas_plan_features (
  plan_id,
  feature_key,
  feature_name,
  is_enabled,
  is_public,
  limit_value,
  configuration
)
select
  plan.id,
  entitlement.feature_key,
  entitlement.feature_name,
  true,
  false,
  entitlement.limit_value,
  entitlement.configuration
from entitlement_values entitlement
join public.saas_plans plan
  on plan.code = entitlement.plan_code
on conflict (
  plan_id,
  feature_key
)
do update set
  feature_name =
    excluded.feature_name,
  is_enabled =
    excluded.is_enabled,
  is_public =
    excluded.is_public,
  limit_value =
    excluded.limit_value,
  configuration =
    excluded.configuration,
  updated_at =
    now();

commit;
