
alter table public.profiles
  add column if not exists phone text;

comment on column public.profiles.phone is
  'Optional contact phone for the student account profile (E.164 preferred).';
