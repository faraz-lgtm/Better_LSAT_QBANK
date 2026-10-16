-- Durable free_diagnostic_signup conversion claim (cross-browser / cross-device).

alter table public.profiles
  add column if not exists signup_conversion_tracked_at timestamptz null,
  add column if not exists signup_attribution jsonb null;

comment on column public.profiles.signup_conversion_tracked_at is
  'Set when free_diagnostic_signup conversion is claimed once per user (GTM/Meta/PostHog).';

comment on column public.profiles.signup_attribution is
  'First-touch attribution (utm_*, gclid, fbclid, fbp, fbc, gcl_aw) persisted at signup claim.';

-- Prevent one-time false conversions for users who already existed before this feature.
update public.profiles
set signup_conversion_tracked_at = created_at
where signup_conversion_tracked_at is null;
