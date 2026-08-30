-- Phase 3: Officer role and event operations
--
-- Run this once in the Supabase SQL Editor after the baseline schema has been
-- applied. This is an additive migration for an existing BuilderPass project.
-- It does not assign anyone the OFFICER role and it does not grant officers
-- member management, role assignment, profile updates, or event deletion.

begin;

-- Permit MEMBER, OFFICER, and ADMIN roles without changing existing members.
alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('MEMBER', 'OFFICER', 'ADMIN'));

-- Reuse this helper in RLS policies so officers and admins share only the
-- approved event-operations permissions.
create or replace function public.is_officer_or_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where auth_user_id = auth.uid()
      and role in ('OFFICER', 'ADMIN')
  )
$$;

revoke execute on function public.is_officer_or_admin() from public;
grant execute on function public.is_officer_or_admin() to authenticated;

-- Officers and admins may create and update events. Event deletion remains
-- protected by the existing admin-only policy.
drop policy if exists "Admins can create events" on public.events;
create policy "Officers and admins can create events"
  on public.events for insert to authenticated
  with check (
    public.is_officer_or_admin()
    and created_by = auth.uid()
  );

drop policy if exists "Admins can update events" on public.events;
create policy "Officers and admins can update events"
  on public.events for update to authenticated
  using (public.is_officer_or_admin())
  with check (public.is_officer_or_admin());

-- Officers can see registrations while the existing member registration
-- policy remains the only insert policy for registrations.
drop policy if exists "Members can view relevant registrations" on public.event_registrations;
create policy "Members, officers, and admins can view registrations"
  on public.event_registrations for select to authenticated
  using (
    user_id = public.current_profile_id()
    or public.is_officer_or_admin()
  );

-- The registration and attendance screens embed registered member details.
-- This read-only policy exposes only profiles with an event registration to
-- operational staff; profile writes and general member management stay admin-only.
drop policy if exists "Officers can view registered member profiles" on public.profiles;
create policy "Officers can view registered member profiles"
  on public.profiles for select to authenticated
  using (
    public.is_officer_or_admin()
    and exists (
      select 1
      from public.event_registrations as registration
      where registration.user_id = profiles.id
    )
  );

-- Attendance uses an upsert in the current application, so operational staff
-- require select, insert, and update access. Delete access is not added.
drop policy if exists "Members can view relevant attendance" on public.attendance;
create policy "Members, officers, and admins can view attendance"
  on public.attendance for select to authenticated
  using (
    user_id = public.current_profile_id()
    or public.is_officer_or_admin()
  );

drop policy if exists "Admins can create attendance" on public.attendance;
create policy "Officers and admins can create attendance"
  on public.attendance for insert to authenticated
  with check (public.is_officer_or_admin());

drop policy if exists "Admins can update attendance" on public.attendance;
create policy "Officers and admins can update attendance"
  on public.attendance for update to authenticated
  using (public.is_officer_or_admin())
  with check (public.is_officer_or_admin());

commit;
