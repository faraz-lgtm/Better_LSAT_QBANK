-- Single-round-trip PrepTest hub detail for students.
-- Avoids selecting SECTION session metadata (often multi-hundred-KB TOAST) by
-- counting distinct answered questions from answer_events for open sections.

create or replace function public.get_student_prep_test_hub_detail(
  p_user_id uuid,
  p_prep_test_id uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_row record;
  v_sections jsonb;
  v_sessions jsonb;
begin
  select pt.id, pt.module_id, pt.title
  into v_row
  from public.admin_prep_tests pt
  where pt.id = p_prep_test_id
    and public.is_student_visible_prep_test(pt.module_id)
  limit 1;

  if not found then
    return null;
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', s.id,
        'sectionId', s.section_id,
        'sectionNumber', s.section_number,
        'sectionType', s.section_type::text,
        'title', s.title,
        'questionCount', coalesce(s.question_count, 0),
        'isExperimental', coalesce(s.is_experimental, false)
      )
      order by s.section_number nulls last, s.id
    ),
    '[]'::jsonb
  )
  into v_sections
  from public.admin_sections s
  where s.prep_test_id = v_row.id;

  with section_base as (
    select
      ps.id,
      ps.user_id,
      ps.kind,
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
      ps.blind_review_completed_at,
      ps.bookmarked,
      ps.excluded,
      ps.created_at,
      ps.updated_at
    from public.practice_sessions ps
    where ps.user_id = p_user_id
      and ps.prep_test_id = v_row.id
      and ps.kind = 'SECTION'
  ),
  open_section_ids as (
    select sb.id
    from section_base sb
    where sb.completed_at is null
  ),
  answered as (
    select
      ae.practice_session_id,
      count(distinct ae.question_id)::integer as answered_count
    from public.answer_events ae
    where ae.user_id = p_user_id
      and ae.practice_session_id in (select id from open_section_ids)
      and nullif(btrim(ae.selected_answer), '') is not null
    group by ae.practice_session_id
  ),
  section_sessions as (
    select
      jsonb_build_object(
        'id', sb.id,
        'user_id', sb.user_id,
        'kind', sb.kind,
        'prep_test_id', sb.prep_test_id,
        'section_id', sb.section_id,
        'started_at', sb.started_at,
        'completed_at', sb.completed_at,
        'raw_score', sb.raw_score,
        'scaled_score', sb.scaled_score,
        'percentile', sb.percentile,
        'blind_review_raw_score', sb.blind_review_raw_score,
        'blind_review_scaled_score', sb.blind_review_scaled_score,
        'blind_review_percentile', sb.blind_review_percentile,
        'blind_review_completed_at', sb.blind_review_completed_at,
        'bookmarked', coalesce(sb.bookmarked, false),
        'excluded', coalesce(sb.excluded, false),
        'metadata', jsonb_build_object(
          'answeredCount', coalesce(a.answered_count, 0)
        ),
        'created_at', sb.created_at,
        'updated_at', sb.updated_at
      ) as session_json,
      sb.started_at
    from section_base sb
    left join answered a on a.practice_session_id = sb.id
  ),
  prep_test_sessions as (
    select
      jsonb_build_object(
        'id', ps.id,
        'user_id', ps.user_id,
        'kind', ps.kind,
        'prep_test_id', ps.prep_test_id,
        'section_id', ps.section_id,
        'started_at', ps.started_at,
        'completed_at', ps.completed_at,
        'raw_score', ps.raw_score,
        'scaled_score', ps.scaled_score,
        'percentile', ps.percentile,
        'blind_review_raw_score', ps.blind_review_raw_score,
        'blind_review_scaled_score', ps.blind_review_scaled_score,
        'blind_review_percentile', ps.blind_review_percentile,
        'blind_review_completed_at', ps.blind_review_completed_at,
        'bookmarked', coalesce(ps.bookmarked, false),
        'excluded', coalesce(ps.excluded, false),
        'metadata', coalesce(ps.metadata, '{}'::jsonb),
        'created_at', ps.created_at,
        'updated_at', ps.updated_at
      ) as session_json,
      ps.started_at
    from public.practice_sessions ps
    where ps.user_id = p_user_id
      and ps.prep_test_id = v_row.id
      and ps.kind = 'PREPTEST'
  ),
  all_sessions as (
    select session_json, started_at from prep_test_sessions
    union all
    select session_json, started_at from section_sessions
  )
  select coalesce(
    jsonb_agg(session_json order by started_at desc),
    '[]'::jsonb
  )
  into v_sessions
  from all_sessions;

  return jsonb_build_object(
    'row', jsonb_build_object(
      'id', v_row.id,
      'moduleId', v_row.module_id,
      'title', v_row.title,
      'sections', v_sections
    ),
    'sessions', v_sessions
  );
end;
$$;

revoke all on function public.get_student_prep_test_hub_detail(uuid, uuid) from public;
grant execute on function public.get_student_prep_test_hub_detail(uuid, uuid) to service_role;

comment on function public.get_student_prep_test_hub_detail(uuid, uuid) is
  'Student PrepTest hub payload: prep test + sections + slim sessions (no SECTION metadata TOAST).';
