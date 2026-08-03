-- LawHub invite requires first + last name and rejects "+" emails.
-- Persist structured name parts and invite outcomes so checkout can gate
-- before payment and webhooks can record silent invite failures.

alter table public.profiles
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists lawhub_invite_status text
    check (
      lawhub_invite_status is null
      or lawhub_invite_status in ('skipped', 'invited', 'failed')
    ),
  add column if not exists lawhub_invite_last_error text,
  add column if not exists lawhub_invited_at timestamptz;

comment on column public.profiles.first_name is
  'Student given name for LawHub POST /students; required before checkout.';
comment on column public.profiles.last_name is
  'Student family name for LawHub POST /students; required before checkout.';
comment on column public.profiles.lawhub_invite_status is
  'Outcome of the latest LawHub auto-invite after checkout: skipped, invited, or failed.';
comment on column public.profiles.lawhub_invite_last_error is
  'Last LawHub invite skip/failure reason (e.g. no_name, invite_failed).';
comment on column public.profiles.lawhub_invited_at is
  'When the latest LawHub invite attempt completed (success or failure).';

-- Backfill from full_name where possible (first token / remainder).
update public.profiles
set
  first_name = coalesce(
    nullif(trim(first_name), ''),
    nullif(split_part(trim(full_name), ' ', 1), '')
  ),
  last_name = coalesce(
    nullif(trim(last_name), ''),
    case
      when position(' ' in trim(full_name)) > 0
        then nullif(trim(substr(trim(full_name), position(' ' in trim(full_name)) + 1)), '')
      else null
    end
  )
where full_name is not null
  and trim(full_name) <> ''
  and (
    first_name is null
    or trim(first_name) = ''
    or last_name is null
    or trim(last_name) = ''
  );
