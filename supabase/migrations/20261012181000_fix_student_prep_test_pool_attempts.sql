-- Fix attempt aggregation: window functions cannot nest inside aggregate calls.

create or replace function public.list_student_prep_test_pool(
  p_user_id uuid,
  p_filter text default null,
  p_page integer default 1,
  p_page_size integer default 5,
  p_sort text default 'newest'
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_page integer := greatest(1, coalesce(p_page, 1));
  v_page_size integer := least(200, greatest(1, coalesce(p_page_size, 5)));
  v_sort text := case when lower(coalesce(p_sort, 'newest')) = 'oldest' then 'oldest' else 'newest' end;
  v_filter text := case
    when p_filter in ('fresh', 'in_progress', 'completed', 'blind_review') then p_filter
    else null
  end;
  v_result jsonb;
begin
  with catalog as (
    select
      pt.id,
      pt.module_id,
      pt.title,
      nullif(
        substring(
          upper(split_part(btrim(coalesce(pt.module_id, '')), ':', 1))
          from '^LSAC([0-9]+)$'
        ),
        ''
      )::integer as prep_test_number,
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
      ) as sections,
      coalesce(
        sum(
          case
            when s.section_type::text in ('LR', 'RC') and coalesce(s.question_count, 0) > 0
              then coalesce(s.question_count, 0)
            else 0
          end
        ),
        0
      )::integer as question_count,
      count(s.id)::integer as section_count,
      count(*) filter (
        where s.section_type::text in ('LR', 'RC') and coalesce(s.question_count, 0) > 0
      )::integer as practiceable_section_count,
      array_agg(s.id) filter (
        where s.section_type::text in ('LR', 'RC') and coalesce(s.question_count, 0) > 0
      ) as practiceable_section_ids
    from public.admin_prep_tests pt
    left join public.admin_sections s on s.prep_test_id = pt.id
    where public.is_student_visible_prep_test(pt.module_id)
    group by pt.id, pt.module_id, pt.title
  ),
  membership as (
    select
      c.id as prep_test_id,
      case
        when o.prep_test_id is not null then o.in_drills
        when c.prep_test_number is null or c.prep_test_number < 100 then false
        when c.prep_test_number <= 122 then true
        when c.prep_test_number <= 152 then true
        else false
      end as in_drills,
      case
        when o.prep_test_id is not null then o.in_sections
        when c.prep_test_number is null or c.prep_test_number < 100 then false
        when c.prep_test_number <= 122 then false
        when c.prep_test_number <= 152 then true
        else false
      end as in_sections,
      case
        when o.prep_test_id is not null then o.in_tests
        when c.prep_test_number is null or c.prep_test_number < 100 then false
        when c.prep_test_number <= 122 then false
        when c.prep_test_number <= 152 then true
        else true
      end as in_tests
    from catalog c
    left join public.student_prep_test_pool_overrides o
      on o.prep_test_id = c.id and o.user_id = p_user_id
  ),
  pt_sessions as (
    select
      ps.*,
      row_number() over (
        partition by ps.prep_test_id
        order by ps.started_at desc, ps.id desc
      ) as rn_all,
      (
        ps.completed_at is not null
        and (
          ps.blind_review_completed_at is not null
          or coalesce((ps.metadata ->> 'blindReviewSkipped')::boolean, false)
        )
      ) as fully_complete,
      (
        ps.completed_at is not null
        and ps.blind_review_completed_at is null
        and not coalesce((ps.metadata ->> 'blindReviewSkipped')::boolean, false)
      ) as awaiting_blind_review
    from public.practice_sessions ps
    where ps.user_id = p_user_id
      and ps.kind = 'PREPTEST'
      and ps.prep_test_id is not null
  ),
  newest_pt as (
    select * from pt_sessions where rn_all = 1
  ),
  newest_open as (
    select distinct on (prep_test_id) *
    from pt_sessions
    where completed_at is null
    order by prep_test_id, started_at desc, id desc
  ),
  awaiting_br as (
    select distinct on (prep_test_id) *
    from pt_sessions
    where awaiting_blind_review
    order by prep_test_id, started_at desc, id desc
  ),
  section_stats as (
    select
      ps.prep_test_id,
      count(*)::integer as section_session_count,
      array_agg(distinct ps.section_id) filter (
        where ps.completed_at is not null and ps.section_id is not null
      ) as completed_section_ids
    from public.practice_sessions ps
    where ps.user_id = p_user_id
      and ps.kind = 'SECTION'
      and ps.prep_test_id is not null
    group by ps.prep_test_id
  ),
  derived as (
    select
      c.*,
      m.in_drills,
      m.in_sections,
      m.in_tests,
      case
        when n.fully_complete then 'completed'
        when a.id is not null or o.id is not null then 'in_progress'
        when coalesce(array_length(c.practiceable_section_ids, 1), 0) > 0
          and coalesce(array_length(ss.completed_section_ids, 1), 0) > 0
          and c.practiceable_section_ids <@ coalesce(ss.completed_section_ids, '{}'::uuid[])
          then 'completed'
        when coalesce(ss.section_session_count, 0) > 0 then 'in_progress'
        else 'fresh'
      end as status,
      case
        when n.fully_complete then n.scaled_score
        when a.id is not null and (o.id is null or a.started_at < o.started_at) then a.scaled_score
        else null
      end as scaled_score,
      case
        when n.fully_complete then n.blind_review_scaled_score
        when a.id is not null and (o.id is null or a.started_at < o.started_at)
          then a.blind_review_scaled_score
        else null
      end as blind_review_scaled_score,
      case
        when n.fully_complete then null
        when a.id is not null and (o.id is null or a.started_at < o.started_at) then
          case
            when coalesce((a.metadata ->> 'blindReviewActive')::boolean, false) then 'in_progress'
            else 'eligible'
          end
        else null
      end as blind_review_status,
      case
        when n.fully_complete then n.completed_at
        when coalesce(array_length(c.practiceable_section_ids, 1), 0) > 0
          and c.practiceable_section_ids <@ coalesce(ss.completed_section_ids, '{}'::uuid[])
          then (
            select max(ps.completed_at)
            from public.practice_sessions ps
            where ps.user_id = p_user_id
              and ps.kind = 'SECTION'
              and ps.prep_test_id = c.id
              and ps.completed_at is not null
          )
        else null
      end as completed_at,
      case
        when n.fully_complete then n.id
        when a.id is not null and (o.id is null or a.started_at < o.started_at) then a.id
        when o.id is not null then o.id
        when a.id is not null then a.id
        else null
      end as open_prep_test_session_id
    from catalog c
    join membership m on m.prep_test_id = c.id
    left join newest_pt n on n.prep_test_id = c.id
    left join newest_open o on o.prep_test_id = c.id
    left join awaiting_br a on a.prep_test_id = c.id
    left join section_stats ss on ss.prep_test_id = c.id
    where c.practiceable_section_count > 0
  ),
  filtered as (
    select *
    from derived d
    where
      v_filter is null
      or (v_filter = 'fresh' and d.status = 'fresh')
      or (v_filter = 'completed' and d.status = 'completed')
      or (
        v_filter = 'in_progress'
        and d.status = 'in_progress'
        and d.blind_review_status is null
      )
      or (v_filter = 'blind_review' and d.blind_review_status is not null)
  ),
  counted as (
    select
      count(*)::integer as filtered_total,
      (select count(*)::integer from derived) as all_count,
      (select count(*)::integer from derived where status = 'fresh') as fresh_count,
      (
        select count(*)::integer from derived
        where status = 'in_progress' and blind_review_status is null
      ) as in_progress_count,
      (select count(*)::integer from derived where status = 'completed') as completed_count,
      (
        select count(*)::integer from derived where blind_review_status is not null
      ) as blind_review_count
    from filtered
  ),
  ordered as (
    select *
    from filtered
    order by
      case when v_sort = 'newest' then prep_test_number end desc nulls last,
      case when v_sort = 'oldest' then prep_test_number end asc nulls last,
      id
    offset ((v_page - 1) * v_page_size)
    limit v_page_size
  ),
  page_attempt_rows as (
    select
      o.id as prep_test_id,
      ps.id as session_id,
      ps.completed_at,
      ps.scaled_score,
      ps.blind_review_scaled_score,
      (
        count(*) over (partition by ps.prep_test_id)
        - (row_number() over (
             partition by ps.prep_test_id
             order by ps.completed_at desc, ps.id desc
           ) - 1)
      )::integer as attempt_number
    from ordered o
    inner join public.practice_sessions ps
      on ps.user_id = p_user_id
     and ps.kind = 'PREPTEST'
     and ps.prep_test_id = o.id
     and ps.completed_at is not null
  ),
  page_attempts as (
    select
      prep_test_id,
      coalesce(
        jsonb_agg(
          jsonb_build_object(
            'sessionId', session_id,
            'completedAt', completed_at,
            'scaledScore', scaled_score,
            'blindReviewScaledScore', blind_review_scaled_score,
            'attemptNumber', attempt_number
          )
          order by completed_at desc, session_id desc
        ),
        '[]'::jsonb
      ) as attempts
    from page_attempt_rows
    group by prep_test_id
  )
  select jsonb_build_object(
    'prepTests',
      coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'id', o.id,
              'moduleId', o.module_id,
              'title', o.title,
              'prepTestNumber', case when o.prep_test_number is null then null else o.prep_test_number::text end,
              'questionCount', o.question_count,
              'sectionCount', o.section_count,
              'practiceableSectionCount', o.practiceable_section_count,
              'timeMinutes', o.practiceable_section_count * 35,
              'status', o.status,
              'scaledScore', o.scaled_score,
              'blindReviewScaledScore', o.blind_review_scaled_score,
              'blindReviewStatus', o.blind_review_status,
              'completedAt', o.completed_at,
              'attempts', coalesce(pa.attempts, '[]'::jsonb),
              'openPrepTestSessionId', o.open_prep_test_session_id,
              'inDrills', o.in_drills,
              'inSections', o.in_sections,
              'inTests', o.in_tests
            )
            order by
              case when v_sort = 'newest' then o.prep_test_number end desc nulls last,
              case when v_sort = 'oldest' then o.prep_test_number end asc nulls last,
              o.id
          )
          from ordered o
          left join page_attempts pa on pa.prep_test_id = o.id
        ),
        '[]'::jsonb
      ),
    'total', (select filtered_total from counted),
    'page', v_page,
    'pageSize', v_page_size,
    'statusCounts', jsonb_build_object(
      'all', (select all_count from counted),
      'fresh', (select fresh_count from counted),
      'in_progress', (select in_progress_count from counted),
      'completed', (select completed_count from counted),
      'blind_review', (select blind_review_count from counted)
    )
  )
  into v_result;

  return v_result;
end;
$$;
