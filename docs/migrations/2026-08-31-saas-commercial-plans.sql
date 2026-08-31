-- Planos comerciais iniciais do Vectra Commerce.
-- Não modifica o plano privado founder-lifetime.
-- Os preços serão definidos posteriormente.

begin;

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
values
  (
    'essential',
    'Essencial',
    'Estrutura inicial para pequenos negócios começarem a vender pelo Vectra Commerce.',
    'active',
    'monthly',
    null,
    'BRL',
    0,
    10,
    true,
    '{
      "pricing_status": "pending",
      "target": "small_business",
      "marketing_ai": "addon"
    }'::jsonb
  ),
  (
    'professional',
    'Profissional',
    'Mais capacidade para operações comerciais em crescimento.',
    'active',
    'monthly',
    null,
    'BRL',
    0,
    20,
    true,
    '{
      "pricing_status": "pending",
      "target": "growing_business",
      "marketing_ai": "addon",
      "recommended": true
    }'::jsonb
  ),
  (
    'premium',
    'Premium',
    'Maior capacidade para empresas com mais usuários, lojas, produtos e pedidos.',
    'active',
    'monthly',
    null,
    'BRL',
    0,
    30,
    true,
    '{
      "pricing_status": "pending",
      "target": "advanced_business",
      "marketing_ai": "addon"
    }'::jsonb
  )
on conflict (code) do update
set
  name = excluded.name,
  description = excluded.description,
  status = excluded.status,
  billing_interval = excluded.billing_interval,
  price_amount = coalesce(
    public.saas_plans.price_amount,
    excluded.price_amount
  ),
  currency = excluded.currency,
  trial_days = excluded.trial_days,
  sort_order = excluded.sort_order,
  is_public = excluded.is_public,
  metadata = public.saas_plans.metadata || excluded.metadata,
  updated_at = now();

with plan_features (
  plan_code,
  feature_key,
  feature_name,
  limit_value,
  configuration
) as (
  values
    (
      'essential',
      'users',
      '1 usuário',
      1,
      '{"unit":"user"}'
    ),
    (
      'essential',
      'stores',
      '1 loja',
      1,
      '{"unit":"store"}'
    ),
    (
      'essential',
      'products',
      'Até 200 produtos',
      200,
      '{"unit":"product"}'
    ),
    (
      'essential',
      'monthly_orders',
      'Até 500 pedidos por mês',
      500,
      '{"unit":"order","period":"month"}'
    ),
    (
      'essential',
      'marketing_ai_addon',
      'Marketing com IA disponível como adicional',
      null,
      '{"addon":true,"included":false}'
    ),
    (
      'essential',
      'image_generation_addon',
      'Geração de imagens disponível como adicional',
      null,
      '{"addon":true,"included":false}'
    ),
    (
      'essential',
      'video_generation_addon',
      'Geração de vídeos disponível como adicional',
      null,
      '{"addon":true,"included":false}'
    ),

    (
      'professional',
      'users',
      'Até 3 usuários',
      3,
      '{"unit":"user"}'
    ),
    (
      'professional',
      'stores',
      '1 loja',
      1,
      '{"unit":"store"}'
    ),
    (
      'professional',
      'products',
      'Até 1.000 produtos',
      1000,
      '{"unit":"product"}'
    ),
    (
      'professional',
      'monthly_orders',
      'Até 2.000 pedidos por mês',
      2000,
      '{"unit":"order","period":"month"}'
    ),
    (
      'professional',
      'marketing_ai_addon',
      'Marketing com IA disponível como adicional',
      null,
      '{"addon":true,"included":false}'
    ),
    (
      'professional',
      'image_generation_addon',
      'Geração de imagens disponível como adicional',
      null,
      '{"addon":true,"included":false}'
    ),
    (
      'professional',
      'video_generation_addon',
      'Geração de vídeos disponível como adicional',
      null,
      '{"addon":true,"included":false}'
    ),

    (
      'premium',
      'users',
      'Até 10 usuários',
      10,
      '{"unit":"user"}'
    ),
    (
      'premium',
      'stores',
      'Até 3 lojas',
      3,
      '{"unit":"store"}'
    ),
    (
      'premium',
      'products',
      'Até 5.000 produtos',
      5000,
      '{"unit":"product"}'
    ),
    (
      'premium',
      'monthly_orders',
      'Até 10.000 pedidos por mês',
      10000,
      '{"unit":"order","period":"month"}'
    ),
    (
      'premium',
      'marketing_ai_addon',
      'Marketing com IA disponível como adicional',
      null,
      '{"addon":true,"included":false}'
    ),
    (
      'premium',
      'image_generation_addon',
      'Geração de imagens disponível como adicional',
      null,
      '{"addon":true,"included":false}'
    ),
    (
      'premium',
      'video_generation_addon',
      'Geração de vídeos disponível como adicional',
      null,
      '{"addon":true,"included":false}'
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
  feature.feature_key,
  feature.feature_name,
  true,
  true,
  feature.limit_value::bigint,
  feature.configuration::jsonb
from plan_features as feature
join public.saas_plans as plan
  on plan.code = feature.plan_code
on conflict (plan_id, feature_key) do update
set
  feature_name = excluded.feature_name,
  is_enabled = excluded.is_enabled,
  is_public = excluded.is_public,
  limit_value = excluded.limit_value,
  configuration = excluded.configuration,
  updated_at = now();

commit;
