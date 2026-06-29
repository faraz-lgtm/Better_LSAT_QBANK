-- Stripe billing + PrepPlus source tracking for LSAC link paths.

alter table public.profiles
  add column if not exists stripe_customer_id text,
  add column if not exists prep_plus_source text
    check (prep_plus_source is null or prep_plus_source in ('vendor_subscription', 'existing_lsac'));

comment on column public.profiles.stripe_customer_id is 'Stripe customer id for subscription billing.';
comment on column public.profiles.prep_plus_source is 'How the student obtained PrepPlus: vendor_subscription or existing_lsac.';

create table if not exists public.billing_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  stripe_subscription_id text not null,
  stripe_price_id text not null,
  status text not null,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  livemode boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (stripe_subscription_id)
);

create index if not exists billing_subscriptions_user_id_idx
  on public.billing_subscriptions (user_id);

create table if not exists public.stripe_webhook_events (
  stripe_event_id text primary key,
  event_type text not null,
  processed_at timestamptz not null default now(),
  payload jsonb not null default '{}'::jsonb
);

alter table public.billing_subscriptions enable row level security;
alter table public.stripe_webhook_events enable row level security;

create policy "billing_subscriptions_select_own"
  on public.billing_subscriptions
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "stripe_webhook_events_admin_select"
  on public.stripe_webhook_events
  for select
  to authenticated
  using (public.is_admin());
