-- Faster PrepTest pool first paint:
-- 1. One catalog row per PrepTest (JSON sections) instead of a section-per-row scan.
-- 2. Keep grant aligned with the existing list_visible_prep_test_pool_rows helper.

create or replace function public.list_visible_prep_test_pool_catalog()
returns table (
  id uuid,
  module_id text,
  title text,
  sections jsonb
)
language sql
stable
security definer
set search_path = public
as $$
  select
    pt.id,
    pt.module_id,
    pt.title,
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', s.id,
          'sectionType', s.section_type::text,
          'questionCount', coalesce(s.question_count, 0)
        )
        order by s.section_number nulls last, s.id
      ) filter (where s.id is not null),
      '[]'::jsonb
    ) as sections
  from public.admin_prep_tests pt
  left join public.admin_sections s on s.prep_test_id = pt.id
  where public.is_student_visible_prep_test(pt.module_id)
  group by pt.id, pt.module_id, pt.title
  order by pt.module_id;
$$;

comment on function public.list_visible_prep_test_pool_catalog() is
  'Student-visible PrepTests (LSAC 100+) with sections aggregated as JSON for pool listing.';

grant execute on function public.list_visible_prep_test_pool_catalog() to service_role;
