-- Vectra Commerce
-- Normalização universal de aparelhos.
-- Preserva variantes técnicas como Pro+, 4G e 5G.

begin;

create or replace function public.normalize_device_text(
  input_text text
)
returns text
language plpgsql
immutable
parallel safe
set search_path = public, pg_temp
as $$
declare
  normalized text;
begin
  normalized := lower(
    translate(
      coalesce(input_text, ''),
      'áàâãäéèêëíìîïóòôõöúùûüçñ',
      'aaaaaeeeeiiiiooooouuuucn'
    )
  );

  -- "+" possui significado técnico: Pro+ = Pro Plus.
  normalized := regexp_replace(
    normalized,
    '\+',
    ' plus ',
    'g'
  );

  normalized := regexp_replace(
    normalized,
    '[^a-z0-9]+',
    ' ',
    'g'
  );

  normalized := regexp_replace(
    normalized,
    '\s+',
    ' ',
    'g'
  );

  normalized := btrim(normalized);

  -- Marcas escritas incorretamente.
  normalized := regexp_replace(
    normalized,
    '\m(sansung|samsumg|samgung|sansumg)\M',
    'samsung',
    'g'
  );

  normalized := regexp_replace(
    normalized,
    '\m(redimi|readmi|redime|redmy)\M',
    'redmi',
    'g'
  );

  normalized := regexp_replace(
    normalized,
    '\m(xiomi|xaomi|xiaome|xioami)\M',
    'xiaomi',
    'g'
  );

  normalized := regexp_replace(
    normalized,
    '\m(morto|motrola|motorolla)\M',
    'motorola',
    'g'
  );

  normalized := regexp_replace(
    normalized,
    '\m(ipone|iphne|iphonee)\M',
    'iphone',
    'g'
  );

  -- Erros dentro de modelos reconhecíveis.
  normalized := regexp_replace(
    normalized,
    '(\mnote\s+[0-9]+\s+)por(\s|$)',
    '\1pro\2',
    'g'
  );

  normalized := regexp_replace(
    normalized,
    '(\miphone\s+[0-9]+\s+pro\s+)mex(\s|$)',
    '\1max\2',
    'g'
  );

  -- Formatos técnicos canônicos.
  normalized := regexp_replace(
    normalized,
    '\mpro\s+plus\M',
    'pro plus',
    'g'
  );

  normalized := regexp_replace(
    normalized,
    '\m([45])\s+g\M',
    '\1g',
    'g'
  );

  normalized := regexp_replace(
    normalized,
    '\m([asmxg])\s+([0-9]{1,3})\M',
    '\1\2',
    'g'
  );

  return btrim(
    regexp_replace(
      normalized,
      '\s+',
      ' ',
      'g'
    )
  );
end;
$$;

revoke all
on function public.normalize_device_text(text)
from public;

grant execute
on function public.normalize_device_text(text)
to anon, authenticated, service_role;

commit;
