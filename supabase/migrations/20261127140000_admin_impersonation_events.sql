-- Admin → student impersonation audit trail (edge / service-role only).

create table if not exists public.admin_impersonation_events (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references public.profiles (id) on delete cascade,
  student_user_id uuid not null references public.profiles (id) on delete cascade,
  action text not null check (action in ('start', 'end')),
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists admin_impersonation_events_admin_created_idx
  on public.admin_impersonation_events (admin_user_id, created_at desc);

create index if not exists admin_impersonation_events_student_created_idx
  on public.admin_impersonation_events (student_user_id, created_at desc);

alter table public.admin_impersonation_events enable row level security;

-- Service-role / edge only; no authenticated policies.
