-- Phase 8: Event lifecycle, required capacity, and member-owned profile edits
--
-- Run after Phases 3, 5, 6, and 7. Existing unlimited events receive a safe
-- capacity of at least 50 (or their current active RSVP count, if higher).

begin;

alter table public.events
  add column if not exists end_time time;

update public.events as event
set capacity = greatest(
  50,
  (
    select count(*)::integer
    from public.event_registrations
    where event_registrations.event_id = event.id
      and event_registrations.status = 'REGISTERED'
  )
)
where event.capacity is null;

alter table public.events
  alter column capacity set default 50,
  alter column capacity set not null;

alter table public.events
  drop constraint if exists events_capacity_positive_check;

alter table public.events
  add constraint events_capacity_positive_check
  check (capacity > 0);

alter table public.events
  drop constraint if exists events_end_time_after_start_check;

alter table public.events
  add constraint events_end_time_after_start_check
  check (end_time is null or end_time > start_time);

-- Keep historical rows readable while enforcing the current four-year,
-- seven-program scope for every new or updated profile.
alter table public.profiles
  drop constraint if exists profiles_year_level_check;

alter table public.profiles
  add constraint profiles_year_level_check
  check (year_level between 1 and 4) not valid;

alter table public.profiles
  drop constraint if exists profiles_course_supported_check;

alter table public.profiles
  add constraint profiles_course_supported_check
  check (course in (
    'BS Electrical Engineering (BS EE)',
    'BS Computer Science (BS CS)',
    'BS Information Technology (BS IT)',
    'BS Information Systems (BS IS)',
    'BS Computer Engineering (BS CPE)',
    'BS Data Science and Analytics (BS DSA)',
    'BS Entertainment and Multimedia Computing (BS EMC)'
  )) not valid;

-- New or reactivated reservations stop when an event reaches its configured
-- end time. Legacy events without end_time use start_time as the cutoff.
create or replace function public.rsvp_to_event(p_event_id uuid)
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
  has_registration boolean;
  active_rsvp_count bigint;
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

  select *
  into registration_row
  from public.event_registrations
  where event_registrations.event_id = p_event_id
    and event_registrations.user_id = profile_id
  for update;
  has_registration := found;

  if has_registration and registration_row.status = 'REGISTERED' then
    return query
    select registration_row.id, registration_row.status, registration_row.registered_at, registration_row.cancelled_at;
    return;
  end if;

  if (event_row.event_date + coalesce(event_row.end_time, event_row.start_time))
      <= (now() at time zone 'Asia/Manila') then
    raise exception 'EVENT_ENDED' using errcode = 'P0001';
  end if;

  if event_row.registration_status <> 'OPEN' then
    raise exception 'REGISTRATION_CLOSED' using errcode = 'P0001';
  end if;

  select count(*)
  into active_rsvp_count
  from public.event_registrations
  where event_registrations.event_id = p_event_id
    and event_registrations.status = 'REGISTERED';

  if active_rsvp_count >= event_row.capacity then
    raise exception 'EVENT_FULL' using errcode = 'P0001';
  end if;

  if has_registration then
    update public.event_registrations
    set status = 'REGISTERED',
        registered_at = now(),
        cancelled_at = null
    where event_registrations.id = registration_row.id
    returning * into registration_row;
  else
    insert into public.event_registrations (user_id, event_id, status)
    values (profile_id, p_event_id, 'REGISTERED')
    returning * into registration_row;
  end if;

  return query
  select registration_row.id, registration_row.status, registration_row.registered_at, registration_row.cancelled_at;
end;
$$;

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

  if (event_row.event_date + coalesce(event_row.end_time, event_row.start_time))
      <= (now() at time zone 'Asia/Manila') then
    raise exception 'EVENT_ENDED' using errcode = 'P0001';
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

-- Members may update only their own non-privileged profile fields. Identity,
-- role, linked auth user, and membership ID cannot be changed by this RPC.
create or replace function public.update_own_profile(
  p_first_name text,
  p_last_name text,
  p_course text,
  p_year_level smallint,
  p_section text default null
)
returns table (
  id uuid,
  student_number text,
  first_name text,
  last_name text,
  email text,
  course text,
  year_level smallint,
  section text,
  role text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'AUTHENTICATION_REQUIRED' using errcode = 'P0001';
  end if;

  if nullif(btrim(p_first_name), '') is null
    or nullif(btrim(p_last_name), '') is null
    or nullif(btrim(p_course), '') is null then
    raise exception 'PROFILE_FIELDS_REQUIRED' using errcode = 'P0001';
  end if;

  if p_year_level not between 1 and 4 then
    raise exception 'INVALID_YEAR_LEVEL' using errcode = 'P0001';
  end if;

  if p_course not in (
    'BS Electrical Engineering (BS EE)',
    'BS Computer Science (BS CS)',
    'BS Information Technology (BS IT)',
    'BS Information Systems (BS IS)',
    'BS Computer Engineering (BS CPE)',
    'BS Data Science and Analytics (BS DSA)',
    'BS Entertainment and Multimedia Computing (BS EMC)'
  ) then
    raise exception 'INVALID_COURSE' using errcode = 'P0001';
  end if;

  return query
  update public.profiles as profile
  set first_name = btrim(p_first_name),
      last_name = btrim(p_last_name),
      course = btrim(p_course),
      year_level = p_year_level,
      section = nullif(btrim(p_section), '')
  where profile.auth_user_id = auth.uid()
  returning
    profile.id,
    profile.student_number,
    profile.first_name,
    profile.last_name,
    profile.email,
    profile.course,
    profile.year_level,
    profile.section,
    profile.role;

  if not found then
    raise exception 'PROFILE_NOT_FOUND' using errcode = 'P0001';
  end if;
end;
$$;

revoke all on function public.rsvp_to_event(uuid) from public;
revoke all on function public.cancel_event_rsvp(uuid) from public;
revoke all on function public.update_own_profile(text, text, text, smallint, text) from public;
grant execute on function public.rsvp_to_event(uuid) to authenticated;
grant execute on function public.cancel_event_rsvp(uuid) to authenticated;
grant execute on function public.update_own_profile(text, text, text, smallint, text) to authenticated;

commit;
