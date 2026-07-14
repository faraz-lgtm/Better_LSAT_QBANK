-- Mini diagnostic marketing content (PLATFORM module DIAG-MINI).
-- Questions are seeded via: pnpm seed:mini-diagnostic

create table if not exists public.diagnostic_score_ranges (
  intent_id text not null,
  correct_count int not null check (correct_count >= 0),
  scaled_low int not null check (scaled_low between 120 and 180),
  scaled_high int not null check (scaled_high between 120 and 180),
  percentile_low numeric(4, 1) not null default 0,
  percentile_high numeric(4, 1) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (intent_id, correct_count),
  check (scaled_low <= scaled_high),
  check (percentile_low <= percentile_high)
);

alter table public.diagnostic_score_ranges enable row level security;

create policy "diagnostic_score_ranges_select_authenticated"
  on public.diagnostic_score_ranges for select to authenticated using (true);

create policy "diagnostic_score_ranges_select_anon"
  on public.diagnostic_score_ranges for select to anon using (true);

create policy "diagnostic_score_ranges_admin_mutate"
  on public.diagnostic_score_ranges for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

insert into public.lsac_content_modules (
  module_id,
  module_name,
  module_type,
  description,
  raw_payload
)
values (
  'DIAG-MINI',
  'Mini Diagnostic — Marketing',
  'Diagnostic',
  'Ten-question LR mini diagnostic for acquisition funnel.',
  jsonb_build_object(
    'intentId', 'mini',
    'timeMinutes', 13,
    'questionCount', 10
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
values ('DIAG-MINI', 'Mini Diagnostic — Marketing', now())
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
  'DIAG-MINI',
  'DIAG-MINI-LR-1',
  1,
  'LR'::public.admin_section_type,
  'Logical Reasoning',
  'Answer each question based on the accompanying passage.'
from public.admin_prep_tests t
where t.module_id = 'DIAG-MINI'
on conflict (module_id, section_id) do update
set
  prep_test_id = excluded.prep_test_id,
  section_number = excluded.section_number,
  section_type = excluded.section_type,
  title = excluded.title,
  directions = excluded.directions,
  updated_at = now();

-- Score ranges for mini diagnostic (0–10 correct → projected LSAT band).
insert into public.diagnostic_score_ranges (
  intent_id,
  correct_count,
  scaled_low,
  scaled_high,
  percentile_low,
  percentile_high
)
values
  ('mini', 0, 120, 126, 0, 8),
  ('mini', 1, 127, 133, 8, 15),
  ('mini', 2, 134, 140, 15, 24),
  ('mini', 3, 141, 147, 24, 35),
  ('mini', 4, 148, 154, 35, 48),
  ('mini', 5, 155, 161, 48, 60),
  ('mini', 6, 162, 167, 60, 72),
  ('mini', 7, 168, 172, 72, 82),
  ('mini', 8, 173, 176, 82, 90),
  ('mini', 9, 177, 179, 90, 96),
  ('mini', 10, 180, 180, 96, 99)
on conflict (intent_id, correct_count) do update
set
  scaled_low = excluded.scaled_low,
  scaled_high = excluded.scaled_high,
  percentile_low = excluded.percentile_low,
  percentile_high = excluded.percentile_high,
  updated_at = now();
