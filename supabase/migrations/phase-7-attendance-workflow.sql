-- Phase 7: Three-state attendance workflow
--
-- Run this once in the Supabase SQL Editor after the baseline schema and
-- Phases 3, 5, and 6. It preserves existing attendance history, adds the
-- member section field required by attendee previews, and ensures operational
-- staff can record attendance only for active RSVPs.

begin;

-- Existing member records remain valid until section information is collected.
alter table public.profiles
  add column if not exists section text;

-- Preserve prior ABSENT history under the clearer Phase 7 status name before
-- enforcing the new three-state model.
alter table public.attendance
  drop constraint if exists attendance_status_check;

update public.attendance
set status = 'DID_NOT_ATTEND',
    check_in_time = null
where status = 'ABSENT';

alter table public.attendance
  add constraint attendance_status_check
  check (status in ('NOT_MARKED', 'PRESENT', 'DID_NOT_ATTEND'));

-- Phase 3 normally creates this helper. Keep the migration self-contained for
-- projects that applied an earlier or partial Officer-role migration.
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

-- Attendance is meaningful only for an active event RSVP. This still permits
-- officers/admins to view attendance, while preventing arbitrary browser
-- upserts for unrelated members or events.
drop policy if exists "Admins can create attendance" on public.attendance;
drop policy if exists "Officers and admins can create attendance" on public.attendance;
create policy "Officers and admins can create attendance"
  on public.attendance for insert to authenticated
  with check (
    public.is_officer_or_admin()
    and exists (
      select 1
      from public.event_registrations
      where event_registrations.event_id = attendance.event_id
        and event_registrations.user_id = attendance.user_id
        and event_registrations.status = 'REGISTERED'
    )
  );

drop policy if exists "Admins can update attendance" on public.attendance;
drop policy if exists "Officers and admins can update attendance" on public.attendance;
create policy "Officers and admins can update attendance"
  on public.attendance for update to authenticated
  using (public.is_officer_or_admin())
  with check (
    public.is_officer_or_admin()
    and exists (
      select 1
      from public.event_registrations
      where event_registrations.event_id = attendance.event_id
        and event_registrations.user_id = attendance.user_id
        and event_registrations.status = 'REGISTERED'
    )
  );

-- A persisted NOT_MARKED row is an operational placeholder, not an attendance
-- outcome. It must not block an otherwise valid RSVP cancellation.
create or replace function public.cancel_event_rsvp(p_event_id uuid)
returns table (
  id uuid,
  status text,
  registered_at timestamptz,
  cancelled_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_id uuid;
  event_row public.events%rowtype;
  registration_row public.event_registrations%rowtype;
begin
  profile_id := public.current_profile_id();

  if profile_id is null then
    raise exception 'PROFILE_NOT_FOUND' using errcode = 'P0001';
  end if;

  select *
  into event_row
  from public.events
  where events.id = p_event_id
  for update;

  if not found then
    raise exception 'EVENT_NOT_FOUND' using errcode = 'P0001';
  end if;

  if event_row.registration_status <> 'OPEN' then
    raise exception 'REGISTRATION_CLOSED' using errcode = 'P0001';
  end if;

  select *
  into registration_row
  from public.event_registrations
  where event_registrations.event_id = p_event_id
    and event_registrations.user_id = profile_id
    and event_registrations.status = 'REGISTERED'
  for update;

  if not found then
    raise exception 'NO_ACTIVE_RSVP' using errcode = 'P0001';
  end if;

  if exists (
    select 1
    from public.attendance
    where attendance.event_id = p_event_id
      and attendance.user_id = profile_id
      and attendance.status in ('PRESENT', 'DID_NOT_ATTEND')
  ) then
    raise exception 'CANNOT_CANCEL_ATTENDED_RSVP' using errcode = 'P0001';
  end if;

  update public.event_registrations
  set status = 'CANCELLED',
      cancelled_at = now()
  where event_registrations.id = registration_row.id
  returning * into registration_row;

  return query
  select registration_row.id, registration_row.status, registration_row.registered_at, registration_row.cancelled_at;
end;
$$;

revoke all on function public.cancel_event_rsvp(uuid) from public;
grant execute on function public.cancel_event_rsvp(uuid) to authenticated;

commit;
