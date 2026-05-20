select c.slug, m.title as module, s.title as section, count(l.id) as lessons
from prep_courses c
join prep_course_modules m on m.course_id = c.id
join prep_course_sections s on s.module_id = m.id
join prep_lessons l on l.section_id = s.id
group by c.slug, m.title, s.title;