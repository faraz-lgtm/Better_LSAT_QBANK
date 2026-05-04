-- RBAC bootstrap + admin read access policies.
-- Bootstrap strategy: seed first admin by email lookup from auth.users.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

do $$
declare
  admin_email constant text := 'admin@example.com';
  admin_user_id uuid;
begin
  select u.id
  into admin_user_id
  from auth.users u
  where lower(u.email) = lower(admin_email)
  order by u.created_at asc
  limit 1;

  if admin_user_id is not null then
    insert into public.profiles (id, email, role, updated_at)
    values (admin_user_id, admin_email, 'admin', now())
    on conflict (id) do update
      set role = 'admin',
          updated_at = now();
  end if;
end $$;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own_or_admin"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id or public.is_admin());

drop policy if exists "lsac_student_snapshots_select_own" on public.lsac_student_snapshots;
create policy "lsac_student_snapshots_select_own_or_admin"
  on public.lsac_student_snapshots
  for select
  to authenticated
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "lsac_test_instances_select_own" on public.lsac_test_instances;
create policy "lsac_test_instances_select_own_or_admin"
  on public.lsac_test_instances
  for select
  to authenticated
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "lsac_log_events_select_own" on public.lsac_log_events;
create policy "lsac_log_events_select_own_or_admin"
  on public.lsac_log_events
  for select
  to authenticated
  using (auth.uid() = user_id or public.is_admin());
