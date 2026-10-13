-- Scoped progress for explanation PrepTest list rows (avoid full-user progress on every page).

create or replace function public.user_explanation_question_progress_for_ids(
  p_user_id uuid,
  p_question_ids uuid[]
)
returns table (
  question_id uuid,
  status text
)
language sql
stable
security definer
set search_path = public
as $$
  with ids as (
    select distinct unnest(coalesce(p_question_ids, '{}'::uuid[])) as question_id
  ),
  latest as (
    select distinct on (ae.question_id)
      ae.question_id,
      (ps.completed_at is not null) as session_completed
    from public.answer_events ae
    inner join public.practice_sessions ps on ps.id = ae.practice_session_id
    inner join ids on ids.question_id = ae.question_id
    where ae.user_id = p_user_id
      and ps.prep_test_id is not null
      and ps.kind in ('SECTION', 'PREPTEST')
    order by ae.question_id, ae.created_at desc
  ),
  seen as (
    select distinct qid.question_id
    from public.practice_sessions ps
    cross join lateral jsonb_array_elements_text(
      coalesce(ps.metadata->'seenQuestionIds', '[]'::jsonb)
    ) as seen_id(qid_text)
    inner join ids qid on qid.question_id::text = seen_id.qid_text
    where ps.user_id = p_user_id
      and ps.prep_test_id is not null
      and ps.kind in ('SECTION', 'PREPTEST')
  )
  select
    i.question_id,
    case
      when l.session_completed is true then 'answered'
      when l.question_id is not null then 'in_process'
      when s.question_id is not null then 'seen'
      else 'fresh'
    end as status
  from ids i
  left join latest l on l.question_id = i.question_id
  left join seen s on s.question_id = i.question_id;
$$;

comment on function public.user_explanation_question_progress_for_ids(uuid, uuid[]) is
  'Per-question explanation list status for a scoped PrepTest page of question ids.';

grant execute on function public.user_explanation_question_progress_for_ids(uuid, uuid[]) to service_role;
