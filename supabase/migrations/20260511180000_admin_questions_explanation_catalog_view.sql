-- PrepTest questions with admin-authored explanation content (used by student explanations catalog).
-- Filters at the DB so PostgREST limit/order applies only to matching rows.

create or replace view public.admin_questions_explanation_catalog as
select aq.*
from public.admin_questions aq
where aq.section_id is not null
  and (
    nullif(trim(aq.explanation), '') is not null
    or nullif(trim(aq.video_url), '') is not null
  );

comment on view public.admin_questions_explanation_catalog is
  'PrepTest questions with non-empty explanation HTML and/or video URL for the student explanations library.';

grant select on public.admin_questions_explanation_catalog to authenticated;
