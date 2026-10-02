-- Align published prep course titles with sidebar display names.
update public.prep_courses
set
  title = 'LSAT Essentials Course',
  updated_at = now()
where slug = 'betterlsat-core-syllabus-structure-content'
   or title in (
     'LSAT Essential Course',
     'BetterLSAT Core Syllabus Structure + Content'
   );

update public.prep_courses
set
  title = 'RC Mastery Course',
  updated_at = now()
where slug = 'rc-mastery'
   or title = 'RC Mastery';
