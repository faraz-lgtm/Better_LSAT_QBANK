-- Rename Essentials prep course display title for sidebar / course list.
update public.prep_courses
set
  title = 'LSAT Essential Course',
  updated_at = now()
where slug = 'betterlsat-core-syllabus-structure-content'
   or title = 'BetterLSAT Core Syllabus Structure + Content';
