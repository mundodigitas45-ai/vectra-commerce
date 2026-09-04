begin;

update public.miranda_knowledge
set
  intent = 'politica_troca_devolucao',
  question_example =
    'Posso trocar ou devolver se não gostar?',
  approved_answer =
    'Nas compras realizadas pelo site ou WhatsApp, o cliente pode solicitar a devolução em até 7 dias após o recebimento. Se o produto apresentar defeito, o atendimento deve seguir a garantia legal. Em dúvidas de compatibilidade, solicite primeiro a marca e o modelo exato do aparelho.',
  keywords = array[
    'garantia',
    'troca',
    'trocar',
    'devolver',
    'devolucao',
    'reembolso',
    'nao gostar',
    'nao funcionar',
    'compatibilidade'
  ]::text[],
  active = true,
  updated_at = now()
where company_id =
  'e2e1f5bc-3f6c-4868-9d9c-5c8226df9b3d'::uuid
  and category = 'garantia';

insert into public.miranda_knowledge (
  company_id,
  category,
  intent,
  question_example,
  approved_answer,
  keywords,
  active,
  updated_at
)
select
  'e2e1f5bc-3f6c-4868-9d9c-5c8226df9b3d'::uuid,
  'garantia',
  'politica_troca_devolucao',
  'Posso trocar ou devolver se não gostar?',
  'Nas compras realizadas pelo site ou WhatsApp, o cliente pode solicitar a devolução em até 7 dias após o recebimento. Se o produto apresentar defeito, o atendimento deve seguir a garantia legal. Em dúvidas de compatibilidade, solicite primeiro a marca e o modelo exato do aparelho.',
  array[
    'garantia',
    'troca',
    'trocar',
    'devolver',
    'devolucao',
    'reembolso',
    'nao gostar',
    'nao funcionar',
    'compatibilidade'
  ]::text[],
  true,
  now()
where not exists (
  select 1
  from public.miranda_knowledge
  where company_id =
    'e2e1f5bc-3f6c-4868-9d9c-5c8226df9b3d'::uuid
    and category = 'garantia'
);

commit;
