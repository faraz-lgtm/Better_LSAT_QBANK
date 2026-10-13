-- Single round-trip for analytics overview page (stats + trajectory inputs +
-- history preview + priority aggregates + score conversion rows).

create or replace function public.get_analytics_overview_page_data(
  p_user_id uuid,
  p_history_limit integer default 8
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_limit integer := greatest(1, least(coalesce(p_history_limit, 8), 50));
  v_goal_score integer;
begin
  select sp.goal_score
  into v_goal_score
  from public.student_study_preferences sp
  where sp.user_id = p_user_id;

  return (
    with count_stats as (
      select *
      from public.user_overview_count_stats(p_user_id, null)
    ),
    completed_preptests as (
      select
        ps.id,
        ps.started_at,
        ps.completed_at,
        ps.raw_score,
        ps.scaled_score,
        ps.percentile,
        ps.blind_review_raw_score,
        ps.blind_review_scaled_score,
        ps.blind_review_percentile,
        ps.blind_review_completed_at,
        ps.prep_test_id,
        jsonb_build_object(
          'title', coalesce(pt.title, 'PrepTest'),
          'module_id', pt.module_id
        ) as admin_prep_tests
      from public.practice_sessions ps
      left join public.admin_prep_tests pt on pt.id = ps.prep_test_id
      where ps.user_id = p_user_id
        and ps.kind = 'PREPTEST'
        and ps.completed_at is not null
        and public.is_student_visible_prep_test(pt.module_id)
      order by ps.completed_at asc
    ),
    section_sessions as (
      select
        ss.id,
        ss.prep_test_id,
        ss.section_id,
        ss.started_at,
        ss.completed_at,
        ss.raw_score,
        ss.is_experimental,
        ss.section_type,
        ss.question_count
      from public.list_user_completed_section_sessions_slim(p_user_id, null) ss
    ),
    prep_test_ids as (
      select distinct x.prep_test_id as id
      from (
        select prep_test_id from completed_preptests where prep_test_id is not null
        union
        select prep_test_id from section_sessions where prep_test_id is not null
      ) x
    ),
    score_rows as (
      select
        st.prep_test_id,
        sr.raw_score,
        sr.scaled_score,
        sr.percentile
      from public.admin_score_tables st
      inner join public.admin_score_rows sr on sr.score_table_id = st.id
      where st.prep_test_id in (select id from prep_test_ids)
    ),
    drill_history as (
      select
        ps.id,
        ps.kind::text as kind,
        ps.prep_test_id,
        ps.section_id,
        ps.started_at,
        ps.completed_at,
        ps.raw_score,
        ps.scaled_score,
        ps.percentile,
        ps.blind_review_raw_score,
        ps.blind_review_scaled_score,
        ps.blind_review_percentile,
        ps.bookmarked,
        ps.excluded,
        coalesce(ps.metadata, '{}'::jsonb) as metadata,
        pt.title as prep_test_title,
        s.title as section_title,
        s.section_type::text as section_type
      from public.practice_sessions ps
      left join public.admin_prep_tests pt on pt.id = ps.prep_test_id
      left join public.admin_sections s on s.id = ps.section_id
      where ps.user_id = p_user_id
        and ps.kind = 'DRILL'
        and ps.completed_at is not null
      order by ps.completed_at desc
      limit v_limit
    ),
    section_history as (
      select
        ps.id,
        ps.kind::text as kind,
        ps.prep_test_id,
        ps.section_id,
        ps.started_at,
        ps.completed_at,
        ps.raw_score,
        ps.scaled_score,
        ps.percentile,
        ps.blind_review_raw_score,
        ps.blind_review_scaled_score,
        ps.blind_review_percentile,
        ps.bookmarked,
        ps.excluded,
        coalesce(ps.metadata, '{}'::jsonb) as metadata,
        pt.title as prep_test_title,
        s.title as section_title,
        s.section_type::text as section_type
      from public.practice_sessions ps
      left join public.admin_prep_tests pt on pt.id = ps.prep_test_id
      left join public.admin_sections s on s.id = ps.section_id
      where ps.user_id = p_user_id
        and ps.kind = 'SECTION'
        and ps.completed_at is not null
        and public.is_student_visible_prep_test(coalesce(pt.module_id, s.module_id))
      order by ps.completed_at desc
      limit v_limit
    ),
    preptest_history as (
      select
        ps.id,
        ps.kind::text as kind,
        ps.prep_test_id,
        ps.section_id,
        ps.started_at,
        ps.completed_at,
        ps.raw_score,
        ps.scaled_score,
        ps.percentile,
        ps.blind_review_raw_score,
        ps.blind_review_scaled_score,
        ps.blind_review_percentile,
        ps.bookmarked,
        ps.excluded,
        coalesce(ps.metadata, '{}'::jsonb) as metadata,
        pt.title as prep_test_title,
        s.title as section_title,
        s.section_type::text as section_type
      from public.practice_sessions ps
      left join public.admin_prep_tests pt on pt.id = ps.prep_test_id
      left join public.admin_sections s on s.id = ps.section_id
      where ps.user_id = p_user_id
        and ps.kind = 'PREPTEST'
        and ps.completed_at is not null
        and public.is_student_visible_prep_test(pt.module_id)
      order by ps.completed_at desc
      limit v_limit
    ),
    history_type_ids as (
      select distinct
        case
          when coalesce(d.metadata->>'questionTypeId', '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
            then (d.metadata->>'questionTypeId')::uuid
          else null
        end as question_type_id
      from drill_history d
    ),
    history_question_types as (
      select
        qt.id,
        qt.name,
        qt.section_type::text as section_type
      from public.question_types qt
      where qt.is_active = true
        and qt.id in (
          select question_type_id
          from history_type_ids
          where question_type_id is not null
        )
    ),
    priority_agg as (
      select
        ae.question_type_id,
        count(*)::integer as attempt_count,
        count(*) filter (where ae.is_correct)::integer as correct_count,
        count(distinct ae.question_id)::integer as unique_question_count
      from public.answer_events ae
      inner join public.admin_questions q on q.id = ae.question_id
      inner join public.admin_sections s on s.id = q.section_id
      left join public.admin_prep_tests pt on pt.id = s.prep_test_id
      left join public.practice_sessions ps on ps.id = ae.practice_session_id
      where ae.user_id = p_user_id
        and ae.question_type_id is not null
        and coalesce(ps.excluded, false) = false
        and public.is_student_visible_prep_test(coalesce(pt.module_id, s.module_id))
      group by ae.question_type_id
    ),
    difficulty_agg as (
      select
        ae.question_type_id,
        avg(ae.difficulty)::double precision as avg_difficulty
      from public.answer_events ae
      inner join public.admin_questions q on q.id = ae.question_id
      inner join public.admin_sections s on s.id = q.section_id
      left join public.admin_prep_tests pt on pt.id = s.prep_test_id
      left join public.practice_sessions ps on ps.id = ae.practice_session_id
      where ae.user_id = p_user_id
        and ae.question_type_id is not null
        and ae.difficulty is not null
        and coalesce(ps.excluded, false) = false
        and public.is_student_visible_prep_test(coalesce(pt.module_id, s.module_id))
      group by ae.question_type_id
    ),
    priority_rows as (
      select
        pa.question_type_id,
        pa.attempt_count,
        pa.correct_count,
        pa.unique_question_count,
        da.avg_difficulty,
        qt.name,
        qt.section_type::text as section_type,
        qt.goal_accuracy,
        qt.avg_per_test
      from priority_agg pa
      left join difficulty_agg da on da.question_type_id = pa.question_type_id
      left join public.question_types qt
        on qt.id = pa.question_type_id
       and qt.is_active = true
    )
    select jsonb_build_object(
      'count_stats', (
        select jsonb_build_object(
          'total_questions_answered', cs.total_questions_answered,
          'drill_correct', cs.drill_correct,
          'drill_total', cs.drill_total,
          'practice_study_minutes', cs.practice_study_minutes,
          'lesson_study_minutes', cs.lesson_study_minutes
        )
        from count_stats cs
      ),
      'goal_score', v_goal_score,
      'completed_preptests', coalesce(
        (select jsonb_agg(to_jsonb(cp) order by cp.completed_at) from completed_preptests cp),
        '[]'::jsonb
      ),
      'section_sessions', coalesce(
        (select jsonb_agg(to_jsonb(ss)) from section_sessions ss),
        '[]'::jsonb
      ),
      'score_rows', coalesce(
        (select jsonb_agg(to_jsonb(sr)) from score_rows sr),
        '[]'::jsonb
      ),
      'history', jsonb_build_object(
        'drill', coalesce(
          (select jsonb_agg(to_jsonb(d) order by d.completed_at desc) from drill_history d),
          '[]'::jsonb
        ),
        'section', coalesce(
          (select jsonb_agg(to_jsonb(s) order by s.completed_at desc) from section_history s),
          '[]'::jsonb
        ),
        'preptest', coalesce(
          (select jsonb_agg(to_jsonb(p) order by p.completed_at desc) from preptest_history p),
          '[]'::jsonb
        )
      ),
      'history_question_types', coalesce(
        (select jsonb_agg(to_jsonb(hqt)) from history_question_types hqt),
        '[]'::jsonb
      ),
      'priority_rows', coalesce(
        (select jsonb_agg(to_jsonb(pr)) from priority_rows pr),
        '[]'::jsonb
      )
    )
  );
end;
$$;

comment on function public.get_analytics_overview_page_data(uuid, integer) is
  'Single round-trip payload for analytics overview page bundle.';

grant execute on function public.get_analytics_overview_page_data(uuid, integer) to service_role;
