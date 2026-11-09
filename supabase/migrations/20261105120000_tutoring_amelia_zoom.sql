-- Tutoring sessions mirrored from Amelia + Zoom cloud recording/transcript artifacts.

alter table public.profiles
  add column if not exists amelia_customer_id integer;

comment on column public.profiles.amelia_customer_id is
  'Amelia customer id linked by email for tutoring bookings.';

create unique index if not exists profiles_amelia_customer_id_uidx
  on public.profiles (amelia_customer_id)
  where amelia_customer_id is not null;

create table if not exists public.tutoring_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  amelia_booking_id integer,
  amelia_appointment_id integer,
  amelia_service_id integer,
  amelia_provider_id integer,
  tutor_name text,
  focus text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  timezone text,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'completed', 'canceled', 'no_show')),
  zoom_meeting_id text,
  zoom_meeting_uuid text,
  join_url text,
  recording_status text not null default 'none'
    check (recording_status in ('none', 'processing', 'ready', 'failed')),
  transcript_status text not null default 'none'
    check (transcript_status in ('none', 'processing', 'ready', 'failed')),
  artifacts_emailed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.tutoring_sessions is
  'Student tutoring appointments mirrored from Amelia (Zoom join + artifact status).';

create unique index if not exists tutoring_sessions_amelia_booking_uidx
  on public.tutoring_sessions (amelia_booking_id)
  where amelia_booking_id is not null;

create unique index if not exists tutoring_sessions_amelia_appointment_uidx
  on public.tutoring_sessions (amelia_appointment_id)
  where amelia_appointment_id is not null;

create index if not exists tutoring_sessions_user_starts_idx
  on public.tutoring_sessions (user_id, starts_at desc);

create index if not exists tutoring_sessions_zoom_meeting_id_idx
  on public.tutoring_sessions (zoom_meeting_id)
  where zoom_meeting_id is not null;

create index if not exists tutoring_sessions_zoom_meeting_uuid_idx
  on public.tutoring_sessions (zoom_meeting_uuid)
  where zoom_meeting_uuid is not null;

create table if not exists public.tutoring_session_artifacts (
  session_id uuid primary key references public.tutoring_sessions (id) on delete cascade,
  recording_storage_path text,
  recording_content_type text,
  duration_seconds integer,
  transcript_storage_path text,
  transcript_json jsonb,
  zoom_share_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.tutoring_session_artifacts is
  'Cloud recording + parsed Zoom transcript for a tutoring session.';

create table if not exists public.tutoring_package_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  amelia_package_customer_id integer,
  amelia_package_id integer,
  name text,
  slots_total integer not null default 0,
  slots_remaining integer not null default 0,
  status text not null default 'active'
    check (status in ('active', 'exhausted', 'canceled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.tutoring_package_entitlements is
  'Amelia package purchase mirror for student tutoring slot progress.';

create unique index if not exists tutoring_package_entitlements_amelia_pkg_customer_uidx
  on public.tutoring_package_entitlements (amelia_package_customer_id)
  where amelia_package_customer_id is not null;

create index if not exists tutoring_package_entitlements_user_idx
  on public.tutoring_package_entitlements (user_id);

alter table public.tutoring_sessions enable row level security;
alter table public.tutoring_session_artifacts enable row level security;
alter table public.tutoring_package_entitlements enable row level security;

drop policy if exists "tutoring_sessions_select_own" on public.tutoring_sessions;
create policy "tutoring_sessions_select_own"
  on public.tutoring_sessions
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "tutoring_session_artifacts_select_own" on public.tutoring_session_artifacts;
create policy "tutoring_session_artifacts_select_own"
  on public.tutoring_session_artifacts
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.tutoring_sessions s
      where s.id = session_id
        and s.user_id = auth.uid()
    )
  );

drop policy if exists "tutoring_package_entitlements_select_own" on public.tutoring_package_entitlements;
create policy "tutoring_package_entitlements_select_own"
  on public.tutoring_package_entitlements
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Private media; edge functions use service role. Owners get signed URLs from tutoring API.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'tutoring-session-media',
  'tutoring-session-media',
  false,
  524288000,
  array[
    'video/mp4',
    'audio/mp4',
    'audio/mpeg',
    'audio/x-m4a',
    'text/vtt',
    'text/plain',
    'application/json'
  ]::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
