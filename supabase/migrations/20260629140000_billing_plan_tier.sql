alter table public.billing_subscriptions
  add column if not exists plan_tier text
    check (plan_tier is null or plan_tier in ('core', 'live'));

comment on column public.billing_subscriptions.plan_tier is 'Better LSAT plan tier: core ($70/mo) or live ($129/mo).';
