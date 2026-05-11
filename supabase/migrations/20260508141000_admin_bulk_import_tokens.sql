create table public.admin_bulk_import_tokens (
  token text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  course jsonb not null,
  rows jsonb not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  check (length(trim(token)) > 0)
);

create index admin_bulk_import_tokens_user_expires_idx
  on public.admin_bulk_import_tokens (user_id, expires_at);

create index admin_bulk_import_tokens_expires_idx
  on public.admin_bulk_import_tokens (expires_at);

alter table public.admin_bulk_import_tokens enable row level security;
