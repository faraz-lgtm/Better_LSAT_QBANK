alter table public.profiles
add column if not exists is_first_time_login boolean not null default true;

comment on column public.profiles.is_first_time_login is
  'Temporary onboarding/login gate: true until user reaches dashboard or completes onboarding.';
