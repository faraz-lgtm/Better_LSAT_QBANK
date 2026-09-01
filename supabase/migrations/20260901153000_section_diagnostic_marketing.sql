-- Section diagnostic marketing content (PLATFORM module DIAG-SEC).
-- Questions are seeded via: pnpm seed:section-diagnostic

insert into public.lsac_content_modules (
  module_id,
  module_name,
  module_type,
  description,
  raw_payload
)
values (
  'DIAG-SEC',
  'Section Diagnostic — Marketing',
  'Diagnostic',
  'Twenty-five-question LR section diagnostic for acquisition funnel.',
  jsonb_build_object(
    'intentId', 'quick',
    'timeMinutes', 35,
    'questionCount', 25
  )
)
on conflict (module_id) do update
set
  module_name = excluded.module_name,
  module_type = excluded.module_type,
  description = excluded.description,
  raw_payload = excluded.raw_payload,
  imported_at = now();

insert into public.admin_prep_tests (module_id, title, imported_at)
values ('DIAG-SEC', 'Section Diagnostic — Marketing', now())
on conflict (module_id) do update
set title = excluded.title, updated_at = now();

insert into public.admin_sections (
  prep_test_id,
  module_id,
  section_id,
  section_number,
  section_type,
  title,
  directions
)
select
  t.id,
  'DIAG-SEC',
  'DIAG-SEC-LR-1',
  1,
  'LR'::public.admin_section_type,
  'Logical Reasoning',
  'Answer each question based on the accompanying passage.'
from public.admin_prep_tests t
where t.module_id = 'DIAG-SEC'
on conflict (module_id, section_id) do update
set
  prep_test_id = excluded.prep_test_id,
  section_number = excluded.section_number,
  section_type = excluded.section_type,
  title = excluded.title,
  directions = excluded.directions,
  updated_at = now();

-- Score ranges for section diagnostic (0–25 correct → projected LSAT band via mini-equivalent mapping).
insert into public.diagnostic_score_ranges (
  intent_id,
  correct_count,
  scaled_low,
  scaled_high,
  percentile_low,
  percentile_high
)
select
  'quick',
  gs.correct_count,
  mini.scaled_low,
  mini.scaled_high,
  mini.percentile_low,
  mini.percentile_high
from generate_series(0, 25) as gs(correct_count)
join public.diagnostic_score_ranges as mini
  on mini.intent_id = 'mini'
 and mini.correct_count = round((gs.correct_count::numeric / 25) * 10)::int
on conflict (intent_id, correct_count) do update
set
  scaled_low = excluded.scaled_low,
  scaled_high = excluded.scaled_high,
  percentile_low = excluded.percentile_low,
  percentile_high = excluded.percentile_high,
  updated_at = now();
