-- Single round-trip for prep-course outline (curriculum + stats + progress).

create or replace function public.get_prep_course_outline(
  p_course_slug text,
  p_user_id uuid,
  p_hydrate text default 'all',
  p_module_id uuid default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_course public.prep_courses%rowtype;
  v_hydrate_ids uuid[];
  v_first_module_id uuid;
  v_module_exists boolean;
begin
  select *
  into v_course
  from public.prep_courses
  where slug = p_course_slug
    and is_published = true
  limit 1;

  if not found then
    return null;
  end if;

  if p_module_id is not null then
    select exists(
      select 1
      from public.prep_course_modules m
      where m.course_id = v_course.id
        and m.id = p_module_id
    )
    into v_module_exists;
    if not v_module_exists then
      -- Still return course shell so the edge layer can throw "Module not found"
      -- with curriculum module ids available for comparison.
      v_hydrate_ids := array[]::uuid[];
    else
      v_hydrate_ids := array[p_module_id];
    end if;
  elsif lower(coalesce(p_hydrate, 'all')) = 'first' then
    select m.id
    into v_first_module_id
    from public.prep_course_modules m
    where m.course_id = v_course.id
    order by m.sort_order asc
    limit 1;
    if v_first_module_id is null then
      v_hydrate_ids := array[]::uuid[];
    else
      v_hydrate_ids := array[v_first_module_id];
    end if;
  else
    select coalesce(array_agg(m.id order by m.sort_order), array[]::uuid[])
    into v_hydrate_ids
    from public.prep_course_modules m
    where m.course_id = v_course.id;
  end if;

  return (
    with modules as (
      select
        m.id,
        m.course_id,
        m.title,
        m.sort_order,
        m.duration_minutes
      from public.prep_course_modules m
      where m.course_id = v_course.id
      order by m.sort_order asc
    ),
    sections as (
      select
        s.id,
        s.module_id,
        s.title,
        s.sort_order,
        s.duration_minutes
      from public.prep_course_sections s
      inner join modules m on m.id = s.module_id
      order by s.sort_order asc
    ),
    hydrated_lessons as (
      select
        l.id,
        l.course_id,
        l.section_id,
        l.slug,
        l.title,
        l.lesson_type,
        l.sort_order,
        l.duration_minutes,
        l.is_published,
        l.created_at,
        l.updated_at
      from public.prep_lessons l
      inner join sections s on s.id = l.section_id
      where l.is_published = true
        and s.module_id = any (v_hydrate_ids)
      order by l.sort_order asc
    ),
    module_stats as (
      select
        m.id as module_id,
        m.sort_order,
        count(l.id)::integer as lesson_count,
        coalesce(sum(l.duration_minutes), 0)::integer as total_minutes
      from modules m
      left join sections s on s.module_id = m.id
      left join public.prep_lessons l
        on l.section_id = s.id
        and l.is_published = true
      group by m.id, m.sort_order
    ),
    completed as (
      select coalesce(
        jsonb_agg(pl.slug order by pl.slug),
        '[]'::jsonb
      ) as slugs
      from public.prep_lesson_completions plc
      inner join public.prep_lessons pl on pl.id = plc.lesson_id
      where plc.user_id = p_user_id
        and pl.course_id = v_course.id
        and pl.is_published = true
    ),
    module_bookmarks as (
      select coalesce(jsonb_agg(b.module_id order by b.module_id), '[]'::jsonb) as ids
      from public.prep_course_module_bookmarks b
      inner join public.prep_course_modules m on m.id = b.module_id
      where b.user_id = p_user_id
        and m.course_id = v_course.id
    ),
    lesson_bookmarks as (
      select coalesce(jsonb_agg(pl.slug order by pl.slug), '[]'::jsonb) as slugs
      from public.prep_lesson_bookmarks b
      inner join public.prep_lessons pl on pl.id = b.lesson_id
      where b.user_id = p_user_id
        and pl.course_id = v_course.id
        and pl.is_published = true
    ),
    curriculum_modules as (
      select coalesce(
        jsonb_agg(
          jsonb_build_object(
            'id', m.id,
            'course_id', m.course_id,
            'title', m.title,
            'sort_order', m.sort_order,
            'duration_minutes', m.duration_minutes,
            'sections', (
              select coalesce(
                jsonb_agg(
                  jsonb_build_object(
                    'id', s.id,
                    'module_id', s.module_id,
                    'title', s.title,
                    'sort_order', s.sort_order,
                    'duration_minutes', s.duration_minutes,
                    'lessons', (
                      select coalesce(
                        jsonb_agg(
                          jsonb_build_object(
                            'id', l.id,
                            'course_id', l.course_id,
                            'section_id', l.section_id,
                            'slug', l.slug,
                            'title', l.title,
                            'lesson_type', l.lesson_type,
                            'sort_order', l.sort_order,
                            'duration_minutes', l.duration_minutes,
                            'is_published', l.is_published,
                            'created_at', l.created_at,
                            'updated_at', l.updated_at,
                            'summary', null,
                            'video_url', null,
                            'text_content', null
                          )
                          order by l.sort_order
                        ),
                        '[]'::jsonb
                      )
                      from hydrated_lessons l
                      where l.section_id = s.id
                    )
                  )
                  order by s.sort_order
                ),
                '[]'::jsonb
              )
              from sections s
              where s.module_id = m.id
            )
          )
          order by m.sort_order
        ),
        '[]'::jsonb
      ) as modules
      from modules m
    ),
    lessons_flat as (
      select coalesce(
        jsonb_agg(
          jsonb_build_object(
            'id', l.id,
            'course_id', l.course_id,
            'section_id', l.section_id,
            'slug', l.slug,
            'title', l.title,
            'lesson_type', l.lesson_type,
            'sort_order', l.sort_order,
            'duration_minutes', l.duration_minutes,
            'is_published', l.is_published,
            'created_at', l.created_at,
            'updated_at', l.updated_at,
            'summary', null,
            'video_url', null,
            'text_content', null
          )
          order by l.sort_order
        ),
        '[]'::jsonb
      ) as lessons
      from hydrated_lessons l
    ),
    stats_json as (
      select coalesce(
        jsonb_agg(
          jsonb_build_object(
            'moduleId', ms.module_id,
            'lessonCount', ms.lesson_count,
            'totalMinutes', ms.total_minutes
          )
          order by ms.sort_order
        ),
        '[]'::jsonb
      ) as stats
      from module_stats ms
    )
    select jsonb_build_object(
      'course', jsonb_build_object(
        'id', v_course.id,
        'slug', v_course.slug,
        'title', v_course.title,
        'description', v_course.description,
        'is_published', v_course.is_published,
        'created_at', v_course.created_at,
        'updated_at', v_course.updated_at
      ),
      'curriculum', jsonb_build_object('modules', (select modules from curriculum_modules)),
      'lessons', (select lessons from lessons_flat),
      'completedLessonSlugs', (select slugs from completed),
      'bookmarks', jsonb_build_object(
        'moduleIds', (select ids from module_bookmarks),
        'lessonSlugs', (select slugs from lesson_bookmarks)
      ),
      'hydratedModuleIds', to_jsonb(coalesce(v_hydrate_ids, array[]::uuid[])),
      'moduleStats', (select stats from stats_json)
    )
  );
end;
$$;

comment on function public.get_prep_course_outline(text, uuid, text, uuid) is
  'Single round-trip prep-course outline: curriculum, module stats, completions, bookmarks.';

grant execute on function public.get_prep_course_outline(text, uuid, text, uuid) to service_role;

create index if not exists prep_lesson_completions_lesson_id_idx
  on public.prep_lesson_completions (lesson_id);

create index if not exists prep_lessons_course_published_section_idx
  on public.prep_lessons (course_id, is_published, section_id);
