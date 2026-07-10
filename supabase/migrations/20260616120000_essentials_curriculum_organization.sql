-- Organize BetterLSAT Essentials course after insert-only bulk import.
-- Moves Module 4/5 lessons out of Module 1 and fixes Musical Performances ordering.
-- Idempotent: safe to re-run; keyed by course slug + lesson slugs.

do $$
declare
  v_course_id uuid;
  v_mod1_section_id uuid;
  v_mod4_id uuid;
  v_mod4_section_id uuid;
  v_mod5_id uuid;
  v_mod5_section_id uuid;
  module_4_slugs text[] := array[
    'the-conditional-universe',
    'the-concept-behind-conditionals',
    'the-anatomy-of-a-condition-sufficient-and-necessary',
    'intro-to-diagramming',
    'the-rules-of-negation',
    'sufficiency-indicators-family-1',
    'rep-work-mapping-family-1-indicators',
    'necessity-indicators-family-2',
    'rep-work-mapping-family-2-indicators',
    'the-if-not-indicators-family-3',
    'rep-work-mapping-family-3-indicators',
    'the-then-not-indicators-family-4',
    'rep-work-mapping-family-4-indicators',
    'summary-the-four-indicator-families',
    'the-mirror-flip-the-contrapositive',
    'rep-work-diagramming-the-contrapositive',
    'active-drill-requiring-residents-to-recycle',
    'active-drill-is-wealth-a-good-thing',
    'conditional-argument-forms',
    'rep-work-conditional-mapping-practice',
    'rep-work-conditional-mapping-practice-hard',
    'full-drill-conditional-questions',
    'conditionals-aren-t-always-straight-forward',
    'compound-conditionals-and-and-or',
    'compound-conditional-contrapositives',
    'rep-work-compound-conditional-practice',
    'active-drill-funding-a-new-department',
    'full-drill-more-conditional-questions',
    'the-quantifier-spectrum',
    'the-danger-words',
    'rules-of-engagement-with-quantifiers',
    'rep-work-translating-quantifier-statements-1',
    'rep-work-translating-quantifier-statements-2',
    'chaining-conditionals-with-quantifiers',
    'rep-work-mapping-chained-quantifiers',
    'how-to-negate-conditionals-and-quantifiers',
    'rep-work-negating-quantifier-statements-1',
    'rep-work-negating-quantifier-statements-2',
    'active-drill-good-and-bad-hunters',
    'active-drill-brilliant-professors',
    'full-drill-diagramming-mastery',
    'summary-the-conditional-blueprint'
  ];
  module_5_slugs text[] := array[
    'welcome-to-informal-logic',
    'the-informal-argument-types',
    'rep-work-identify-informal-arguments',
    'the-king-of-informal-logic-causation',
    'the-phenomenon-and-the-hypothesis',
    'evaluating-hypotheses',
    'what-s-actually-causal',
    'rep-work-auditing-causal-claims',
    'causal-chains',
    'causal-logic-vs-conditional-logic',
    'rep-work-mapping-causal-chains',
    'active-drill-coastal-estuaries',
    'correlations',
    'correlations-causation',
    'the-four-potential-explanations',
    'rep-work-generating-the-alternatives',
    'active-drill-theta-brain-waves',
    'active-drill-continental-rainfall-increases',
    'using-science-as-a-tool',
    'it-s-hard-to-be-perfect',
    'active-drill-treadmill-study',
    'full-drill-2',
    'what-s-up-next-2'
  ];
begin
  select id
  into v_course_id
  from public.prep_courses
  where slug = 'betterlsat-core-syllabus-structure-content';

  if v_course_id is null then
    raise notice 'Essentials course not found; skipping curriculum organization.';
    return;
  end if;

  select pcs.id
  into v_mod1_section_id
  from public.prep_course_modules pcm
  join public.prep_course_sections pcs on pcs.module_id = pcm.id
  where pcm.course_id = v_course_id
    and pcm.sort_order = 1
    and pcs.sort_order = 1;

  if v_mod1_section_id is null then
    raise exception 'Module 1 section not found for essentials course %', v_course_id;
  end if;

  select id into v_mod4_id
  from public.prep_course_modules
  where course_id = v_course_id
    and sort_order = 4;

  if v_mod4_id is null then
    insert into public.prep_course_modules (course_id, title, sort_order)
    values (v_course_id, 'Diagramming Mastery', 4)
    returning id into v_mod4_id;
  else
    update public.prep_course_modules
    set title = 'Diagramming Mastery', updated_at = now()
    where id = v_mod4_id;
  end if;

  select id into v_mod4_section_id
  from public.prep_course_sections
  where module_id = v_mod4_id
    and sort_order = 1;

  if v_mod4_section_id is null then
    insert into public.prep_course_sections (module_id, title, sort_order)
    values (v_mod4_id, 'General', 1)
    returning id into v_mod4_section_id;
  end if;

  select id into v_mod5_id
  from public.prep_course_modules
  where course_id = v_course_id
    and sort_order = 5;

  if v_mod5_id is null then
    insert into public.prep_course_modules (course_id, title, sort_order)
    values (v_course_id, 'The Land of Informal Logic', 5)
    returning id into v_mod5_id;
  else
    update public.prep_course_modules
    set title = 'The Land of Informal Logic', updated_at = now()
    where id = v_mod5_id;
  end if;

  select id into v_mod5_section_id
  from public.prep_course_sections
  where module_id = v_mod5_id
    and sort_order = 1;

  if v_mod5_section_id is null then
    insert into public.prep_course_sections (module_id, title, sort_order)
    values (v_mod5_id, 'General', 1)
    returning id into v_mod5_section_id;
  end if;

  -- Free sort_order slots in Module 1 before reordering Musical Performances / The Road Ahead.
  update public.prep_lessons pl
  set sort_order = pl.sort_order + 10000,
      updated_at = now()
  where pl.section_id = v_mod1_section_id
    and pl.sort_order <= 100
    and (
      pl.slug = 'the-road-ahead'
      or pl.slug = 'active-drill-musical-performances'
      or pl.slug = any(module_4_slugs)
      or pl.slug = any(module_5_slugs)
    );

  -- Move Module 4 lessons into Module 4 / General.
  with ordered(slug, ord) as (
    select slug, ord::int
    from unnest(module_4_slugs) with ordinality as t(slug, ord)
  )
  update public.prep_lessons pl
  set section_id = v_mod4_section_id,
      sort_order = ordered.ord,
      updated_at = now()
  from ordered
  where pl.course_id = v_course_id
    and pl.slug = ordered.slug;

  -- Move Module 5 lessons into Module 5 / General.
  with ordered(slug, ord) as (
    select slug, ord::int
    from unnest(module_5_slugs) with ordinality as t(slug, ord)
  )
  update public.prep_lessons pl
  set section_id = v_mod5_section_id,
      sort_order = ordered.ord,
      updated_at = now()
  from ordered
  where pl.course_id = v_course_id
    and pl.slug = ordered.slug;

  -- Module 1 final order: Musical Performances at 7, The Road Ahead at 8.
  update public.prep_lessons
  set section_id = v_mod1_section_id,
      sort_order = 7,
      updated_at = now()
  where course_id = v_course_id
    and slug = 'active-drill-musical-performances';

  update public.prep_lessons
  set section_id = v_mod1_section_id,
      sort_order = 8,
      updated_at = now()
  where course_id = v_course_id
    and slug = 'the-road-ahead';

  raise notice 'Essentials curriculum organized for course %', v_course_id;
end $$;
