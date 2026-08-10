-- Experimental (unscored) PrepTest sections: still practiced/shown in results, excluded from scaled score.

alter table public.admin_sections
  add column if not exists is_experimental boolean not null default false;

comment on column public.admin_sections.is_experimental is
  'True when the section is an unscored experimental section. Included in practice/results UI but excluded from PrepTest raw/scaled scoring.';

create index if not exists admin_sections_is_experimental_idx
  on public.admin_sections (prep_test_id, is_experimental);

-- Modern scored LSAT shape: keep first RC + first two LR (by section_number) as scored;
-- mark any additional LR/RC sections on the same PrepTest as experimental.
with ranked as (
  select
    id,
    section_type,
    row_number() over (
      partition by prep_test_id, section_type
      order by section_number asc, created_at asc, id asc
    ) as rn
  from public.admin_sections
  where section_type in ('LR', 'RC')
)
update public.admin_sections s
set is_experimental = true,
    updated_at = now()
from ranked r
where s.id = r.id
  and (
    (r.section_type = 'RC' and r.rn > 1)
    or (r.section_type = 'LR' and r.rn > 2)
  );
